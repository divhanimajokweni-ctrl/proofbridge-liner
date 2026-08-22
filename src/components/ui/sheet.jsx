"use client";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
import { jsx, jsxs } from "react/jsx-runtime";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
function Sheet(_a) {
  var props = __objRest(_a, []);
  return /* @__PURE__ */ jsx(SheetPrimitive.Root, __spreadValues({ "data-slot": "sheet" }, props));
}
function SheetTrigger(_b) {
  var props = __objRest(_b, []);
  return /* @__PURE__ */ jsx(SheetPrimitive.Trigger, __spreadValues({ "data-slot": "sheet-trigger" }, props));
}
function SheetClose(_c) {
  var props = __objRest(_c, []);
  return /* @__PURE__ */ jsx(SheetPrimitive.Close, __spreadValues({ "data-slot": "sheet-close" }, props));
}
function SheetPortal(_d) {
  var props = __objRest(_d, []);
  return /* @__PURE__ */ jsx(SheetPrimitive.Portal, __spreadValues({ "data-slot": "sheet-portal" }, props));
}
function SheetOverlay(_e) {
  var _f = _e, {
    className
  } = _f, props = __objRest(_f, [
    "className"
  ]);
  return /* @__PURE__ */ jsx(
    SheetPrimitive.Overlay,
    __spreadValues({
      "data-slot": "sheet-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )
    }, props)
  );
}
function SheetContent(_g) {
  var _h = _g, {
    className,
    children,
    side = "right"
  } = _h, props = __objRest(_h, [
    "className",
    "children",
    "side"
  ]);
  return /* @__PURE__ */ jsxs(SheetPortal, { children: [
    /* @__PURE__ */ jsx(SheetOverlay, {}),
    /* @__PURE__ */ jsxs(
      SheetPrimitive.Content,
      __spreadProps(__spreadValues({
        "data-slot": "sheet-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )
      }, props), {
        children: [
          children,
          /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none", children: [
            /* @__PURE__ */ jsx(XIcon, { className: "size-4" }),
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
          ] })
        ]
      })
    )
  ] });
}
function SheetHeader(_i) {
  var _j = _i, { className } = _j, props = __objRest(_j, ["className"]);
  return /* @__PURE__ */ jsx(
    "div",
    __spreadValues({
      "data-slot": "sheet-header",
      className: cn("flex flex-col gap-1.5 p-4", className)
    }, props)
  );
}
function SheetFooter(_k) {
  var _l = _k, { className } = _l, props = __objRest(_l, ["className"]);
  return /* @__PURE__ */ jsx(
    "div",
    __spreadValues({
      "data-slot": "sheet-footer",
      className: cn("mt-auto flex flex-col gap-2 p-4", className)
    }, props)
  );
}
function SheetTitle(_m) {
  var _n = _m, {
    className
  } = _n, props = __objRest(_n, [
    "className"
  ]);
  return /* @__PURE__ */ jsx(
    SheetPrimitive.Title,
    __spreadValues({
      "data-slot": "sheet-title",
      className: cn("text-foreground font-semibold", className)
    }, props)
  );
}
function SheetDescription(_o) {
  var _p = _o, {
    className
  } = _p, props = __objRest(_p, [
    "className"
  ]);
  return /* @__PURE__ */ jsx(
    SheetPrimitive.Description,
    __spreadValues({
      "data-slot": "sheet-description",
      className: cn("text-muted-foreground text-sm", className)
    }, props)
  );
}
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
};
