using System;
using System.Collections;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

[Serializable]
public sealed class LiquidityLeapTelemetry
{
    public string schema_version;
    public string session_id;
    public string game_event;
    public string last_action;
    public string asset_class;
    public string shock_type;
    public float current_pool_balance;
    public float impulse_stability_score;
    public float volatility_multiplier;
    public long client_unix_ms;
}

public sealed class LiquidityLeapManager : MonoBehaviour
{
    private const string SchemaVersion = "liquidity-leap.telemetry.v1";
    private const float MinImpulseStability = 0.0f;
    private const float MaxImpulseStability = 1.0f;
    private const float MinPoolBalance = 0.0f;

    private ClientWebSocket webSocket;
    private CancellationTokenSource cancellationTokenSource;
    private Coroutine shockResetCoroutine;
    private string sessionId;
    private float lastSendTime;

    [Header("Financial State")]
    [SerializeField] private float currentPoolBalance = 1000.0f;
    [SerializeField, Range(MinImpulseStability, MaxImpulseStability)] private float impulseStability = 1.0f;
    [SerializeField] private float stableAssetReward = 50.0f;
    [SerializeField] private float highRiskLoss = 150.0f;
    [SerializeField] private float stableDecisionGain = 0.05f;
    [SerializeField] private float panicDecisionLoss = 0.25f;

    [Header("Market Shock")]
    [SerializeField] private bool isGlobalShockActive;
    [SerializeField] private string activeShockType = "NONE";
    [SerializeField] private float shockDurationSeconds = 8.0f;
    [SerializeField] private float volatilityMultiplier = 1.0f;
    [SerializeField] private float shockVolatilityMultiplier = 2.25f;

    [Header("vLLM / Kasi UI Bridge")]
    [SerializeField] private string vllmWebSocketUrl = "ws://localhost:8000/v1/chat/stream";
    [SerializeField] private string telemetryIngestUrl = "https://venturevisionubuntu.co.za/api/liquidity-leap/telemetry";
    [SerializeField] private string telemetryIngestKey = "";
    [SerializeField] private float telemetryRateLimitSeconds = 0.08f;
    [SerializeField] private bool connectOnStart = true;

    public float CurrentPoolBalance => currentPoolBalance;
    public float ImpulseStability => impulseStability;
    public bool IsGlobalShockActive => isGlobalShockActive;
    public string ActiveShockType => activeShockType;

    private async void Start()
    {
        sessionId = Guid.NewGuid().ToString("N");
        cancellationTokenSource = new CancellationTokenSource();

        if (connectOnStart)
        {
            await ConnectToVllmServer();
        }
    }

    public void RegisterPlayerJump(bool jumpedOnHighRiskAsset)
    {
        string assetClass = jumpedOnHighRiskAsset ? "HIGH_RISK" : "STABLE";
        string action = jumpedOnHighRiskAsset ? "JUMP_HIGH_RISK" : "JUMP_STABLE";

        if (isGlobalShockActive && jumpedOnHighRiskAsset)
        {
            impulseStability = Mathf.Clamp(impulseStability - panicDecisionLoss, MinImpulseStability, MaxImpulseStability);
            currentPoolBalance = Mathf.Max(MinPoolBalance, currentPoolBalance - highRiskLoss * volatilityMultiplier);
            TriggerProofBridgeValidation("PANIC_BUY_DETECTED", assetClass);
        }
        else if (!jumpedOnHighRiskAsset)
        {
            impulseStability = Mathf.Clamp(impulseStability + stableDecisionGain, MinImpulseStability, MaxImpulseStability);
            currentPoolBalance += stableAssetReward;
        }
        else
        {
            currentPoolBalance = Mathf.Max(MinPoolBalance, currentPoolBalance - highRiskLoss);
        }

        SendBehavioralSignal("PLAYER_JUMP_ACTION", action, assetClass);
    }

    public void TriggerGlobalShock(string shockType)
    {
        string normalizedShock = string.IsNullOrWhiteSpace(shockType) ? "UNKNOWN" : shockType.Trim().ToUpperInvariant();

        isGlobalShockActive = true;
        activeShockType = normalizedShock;
        volatilityMultiplier = shockVolatilityMultiplier;

        if (shockResetCoroutine != null)
        {
            StopCoroutine(shockResetCoroutine);
        }

        shockResetCoroutine = StartCoroutine(ResetShockAfterDelay());
        SendBehavioralSignal("MARKET_SHOCK_STARTED", "SHOCK_" + normalizedShock, "SYSTEM");
    }

    public async Task ConnectToVllmServer()
    {
        if (webSocket != null && webSocket.State == WebSocketState.Open)
        {
            return;
        }

        try
        {
            webSocket?.Dispose();
            webSocket = new ClientWebSocket();
            await webSocket.ConnectAsync(new Uri(vllmWebSocketUrl), cancellationTokenSource.Token);
            SendBehavioralSignal("SESSION_CONNECTED", "CONNECT", "SYSTEM");
        }
        catch (Exception ex)
        {
            Debug.LogError("[vLLM Bridge Connection Error] " + ex.Message);
        }
    }

    public async void SendBehavioralSignal(string gameEvent, string lastAction, string assetClass)
    {
        if (Time.unscaledTime - lastSendTime < telemetryRateLimitSeconds)
        {
            return;
        }

        lastSendTime = Time.unscaledTime;

        LiquidityLeapTelemetry telemetry = new LiquidityLeapTelemetry
        {
            schema_version = SchemaVersion,
            session_id = sessionId,
            game_event = gameEvent,
            last_action = lastAction,
            asset_class = assetClass,
            shock_type = activeShockType,
            current_pool_balance = currentPoolBalance,
            impulse_stability_score = impulseStability,
            volatility_multiplier = volatilityMultiplier,
            client_unix_ms = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        string jsonPayload = JsonUtility.ToJson(telemetry);

        if (!string.IsNullOrWhiteSpace(telemetryIngestUrl))
        {
            StartCoroutine(PostTelemetryIngress(jsonPayload));
        }

        if (webSocket == null || webSocket.State != WebSocketState.Open)
        {
            return;
        }

        byte[] bytesToSend = Encoding.UTF8.GetBytes(jsonPayload);

        try
        {
            await webSocket.SendAsync(
                new ArraySegment<byte>(bytesToSend),
                WebSocketMessageType.Text,
                true,
                cancellationTokenSource.Token
            );
        }
        catch (Exception ex)
        {
            Debug.LogError("[Telemetry Pipeline Error] " + ex.Message);
        }
    }

    private IEnumerator ResetShockAfterDelay()
    {
        yield return new WaitForSeconds(shockDurationSeconds);

        isGlobalShockActive = false;
        activeShockType = "NONE";
        volatilityMultiplier = 1.0f;
        shockResetCoroutine = null;
        SendBehavioralSignal("MARKET_SHOCK_ENDED", "SHOCK_CLEAR", "SYSTEM");
    }

    private void TriggerProofBridgeValidation(string reason, string assetClass)
    {
        Debug.Log("[ProofBridge Liner] validation_required reason=" + reason + " asset_class=" + assetClass);
        SendBehavioralSignal("VALIDATION_REQUIRED", reason, assetClass);
    }

    private IEnumerator PostTelemetryIngress(string jsonPayload)
    {
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);

        using (UnityWebRequest request = new UnityWebRequest(telemetryIngestUrl, "POST"))
        {
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            if (!string.IsNullOrWhiteSpace(telemetryIngestKey))
            {
                request.SetRequestHeader("x-proofbridge-telemetry-key", telemetryIngestKey);
            }

            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning("[Telemetry Ingress Warning] " + request.responseCode + " " + request.error);
            }
        }
    }

    private async void OnApplicationQuit()
    {
        await CloseSocket();
    }

    private async void OnDestroy()
    {
        await CloseSocket();
    }

    private async Task CloseSocket()
    {
        if (cancellationTokenSource == null)
        {
            return;
        }

        cancellationTokenSource.Cancel();

        if (webSocket != null)
        {
            try
            {
                if (webSocket.State == WebSocketState.Open)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Unity shutdown", CancellationToken.None);
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning("[vLLM Bridge Close Warning] " + ex.Message);
            }

            webSocket.Dispose();
            webSocket = null;
        }

        cancellationTokenSource.Dispose();
        cancellationTokenSource = null;
    }
}
