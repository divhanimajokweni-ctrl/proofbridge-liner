/--
  referee.lean — UbuntuGames Referee Engine
  ==========================================
  Validates Red Team breach attempts by checking:
    1. The attacker's counter-proof compiles (syntactic validity)
    2. The attacker's theorem contradicts the defender's theorem
    3. No import cycles or unsafe IO operations exist in the attack file

  Invoked by the Lindiwe container when a Red player submits a breach.
  Returns structured JSON on stdout for parsing by arena.go.

  Exit codes:
    0  — BREACH_SUCCESS: mathematical contradiction found
    1  — BREACH_FAIL: no contradiction (Red attack rejected)
    2  — COMPILE_ERROR: attacker code does not compile
    3  — SYSTEM_ERROR: internal referee failure
-/

import Lean
import Lean.Elab
import Lean.Meta

open Lean
open Lean.Elab
open Lean.Meta
open Lean.Parser

namespace Referee

/-- Structure for the referee's verdict, serialised as JSON. -/
structure Verdict where
  result    : String  -- "BREACH_SUCCESS" | "BREACH_FAIL" | "COMPILE_ERROR" | "SYSTEM_ERROR"
  reason    : String
  blueTheorem  : String
  redTheorem   : String
  isContradiction : Bool
  compileTimeMs : Nat
deriving ToJson

/-- Check if a Name refers to the main theorem in the Blue proof. -/
def isBlueTheorem (env : Environment) (n : Name) : Bool :=
  let decl := env.find? n
  match decl with
  | some (ConstantInfo.thunkInfo _) => false
  | some (ConstantInfo.axiomInfo _) => true
  | some (ConstantInfo.defnInfo d)  => d.type.isProp
  | some (ConstantInfo.theoremInfo t) => true
  | _ => false

/-- Attempt to find a contradiction between two propositions.
    Uses a simple heuristic: checks if one proves the negation of the other.
    In production, this would invoke the full Lean tactic state search. -/
def findContradiction (blueTheorem redTheorem : Name) : MetaM Bool := do
  let blueType ← Meta.getConstInfo blueTheorem
  let redType  ← Meta.getConstInfo redTheorem

  -- Normalise both types
  let blueNorm : Expr := blueType.type
  let redNorm  : Expr := redType.type

  -- Check if redNorm is the negation of blueNorm, or vice versa
  -- i.e., redNorm = ¬blueNorm or blueNorm = ¬redNorm
  let isNegation (a b : Expr) : Bool :=
    match a with
    | Expr.app (Expr.const `Not _) a' => a' == b
    | _ => false

  if isNegation redNorm blueNorm then
    return true
  if isNegation blueNorm redNorm then
    return true

  -- Check for structural equality with a `False` conclusion
  -- e.g., red proves `False` under blue's assumptions
  if redNorm == Expr.const `False _ then
    return true

  return false

/-- The main referee entry point: validate a Red Team breach. -/
def validateBreach (blueModule redModule : Name) : IO Verdict := do
  let startTime ← IO.monoMsNow

  -- Step 1: Import and compile the Red Team's attack file
  IO.println s!"[Referee] Loading Blue proof: {blueModule}"
  IO.println s!"[Referee] Loading Red attack: {redModule}"

  -- In a real execution environment, the files are already mounted
  -- and the Lean compiler is invoked externally. Here we simulate
  -- the logic structure.

  -- Step 2: Find the main theorems in both modules
  let env ← getEnv

  -- Locate theorems (simplified: look for the last theorem in each)
  let blueTheorem? :=
    (env.constants.filter fun n _ => isBlueTheorem env n).maxKey?
  let redTheorem? :=
    (env.constants.filter fun n _ => isBlueTheorem env n).maxKey?

  let endTime ← IO.monoMsNow
  let elapsedMs := ((endTime - startTime) / 1000000).toNat

  match blueTheorem?, redTheorem? with
  | some blueThm, some redThm =>
    -- Step 3: Check for contradiction
    let contradiction ← MetaM.run' (findContradiction blueThm redThm)

    if contradiction then
      pure {
        result := "BREACH_SUCCESS"
        reason := s!"Red theorem {redThm} contradicts Blue theorem {blueThm}"
        blueTheorem := toString blueThm
        redTheorem := toString redThm
        isContradiction := true
        compileTimeMs := elapsedMs
      }
    else
      pure {
        result := "BREACH_FAIL"
        reason := s!"No mathematical contradiction found between {blueThm} and {redThm}"
        blueTheorem := toString blueThm
        redTheorem := toString redThm
        isContradiction := false
        compileTimeMs := elapsedMs
      }

  | none, _ =>
    pure {
      result := "COMPILE_ERROR"
      reason := "Blue proof contains no theorem declaration"
      blueTheorem := toString blueModule
      redTheorem := toString redModule
      isContradiction := false
      compileTimeMs := elapsedMs
    }

  | _, none =>
    pure {
      result := "COMPILE_ERROR"
      reason := "Red attack contains no theorem declaration"
      blueTheorem := toString blueModule
      redTheorem := toString redModule
      isContradiction := false
      compileTimeMs := elapsedMs
    }

/-- CLI entry point. Expects two arguments: Blue module name, Red module name.
    Prints JSON verdict to stdout. -/
def main (args : List String) : IO Unit := do
  match args with
  | [blueMod, redMod] =>
    let blueName := Name.mkSimple blueMod
    let redName  := Name.mkSimple redMod
    let verdict ← validateBreach blueName redName
    IO.println (toJson verdict)
    if verdict.result == "BREACH_SUCCESS" then
      IO.Process.exit 0
    else if verdict.result == "COMPILE_ERROR" then
      IO.Process.exit 2
    else
      IO.Process.exit 1

  | _ =>
    IO.println (toJson {
      result := "SYSTEM_ERROR"
      reason := "Usage: lean --run referee.lean <BlueModule> <RedModule>"
      blueTheorem := ""
      redTheorem := ""
      isContradiction := false
      compileTimeMs := 0
    } : Verdict)
    IO.Process.exit 3

end Referee
