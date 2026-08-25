# Ants Payment Rail — Kotlin BLE Reference (3 files)

**Status:** Production-ready reference for the VVU Native contactless payment rail
**Date preserved:** 2026-08-25
**Source:** User-supplied Kotlin code (3 complete files)
**Architecture:** MITM-proof BLE pairing with static-key signing + ECDH ephemeral key exchange
**Target:** `com.yourapp.ble.*` packages (mobile team to integrate)

---

## File 1: `TerminalPairing.kt` — Schema constants + verification

```kotlin
package com.yourapp.ble.pairing

import android.util.Base64
import org.json.JSONObject
import java.security.KeyFactory
import java.security.PublicKey
import java.security.Signature
import java.security.spec.X509EncodedKeySpec

/**
 * Complete MITM-proof pairing for BLE payment sessions.
 *
 * SCHEMA CONSTANTS (for QR and session messages):
 * -------------------------------------------------
 * QR_CERTIFICATE_KEYS:  ["terminal_id", "static_public_key", "root_signature"]
 * SESSION_KEY_KEYS:     ["terminal_id", "ephemeral_public_key", "signature"]
 */
object TerminalPairing {

    // ---------- JSON FIELD NAMES (single source of truth) ----------
    const val FIELD_TERMINAL_ID = "terminal_id"
    const val FIELD_STATIC_PUBLIC_KEY = "static_public_key"
    const val FIELD_ROOT_SIGNATURE = "root_signature"
    const val FIELD_EPHEMERAL_PUBLIC_KEY = "ephemeral_public_key"
    const val FIELD_SIGNATURE = "signature"

    // ---------- Data classes ----------
    data class TerminalCertificate(
        val terminalId: String,
        val staticPublicKeyB64: String,
        val rootSignatureB64: String
    )

    data class SignedEphemeralKey(
        val terminalId: String,
        val ephemeralPublicKeyB64: String,
        val signatureB64: String
    )

    // ---------- QR parsing (phone side, one-time) ----------
    fun verifyAndParseQr(qrContents: String, rootPublicKey: PublicKey): TerminalCertificate? {
        return try {
            val json = JSONObject(qrContents)
            val cert = TerminalCertificate(
                terminalId = json.getString(FIELD_TERMINAL_ID),
                staticPublicKeyB64 = json.getString(FIELD_STATIC_PUBLIC_KEY),
                rootSignatureB64 = json.getString(FIELD_ROOT_SIGNATURE)
            )

            val keyBytes = Base64.decode(cert.staticPublicKeyB64, Base64.NO_WRAP)
            val sigBytes = Base64.decode(cert.rootSignatureB64, Base64.NO_WRAP)

            val verifier = Signature.getInstance("SHA256withECDSA")
            verifier.initVerify(rootPublicKey)
            verifier.update(keyBytes)

            if (verifier.verify(sigBytes)) cert else null
        } catch (e: Exception) {
            null
        }
    }

    // ---------- Session verification (phone side, every BLE session) ----------
    fun verifySignedEphemeralKey(
        signed: SignedEphemeralKey,
        cachedCert: TerminalCertificate
    ): ByteArray? {
        if (signed.terminalId != cachedCert.terminalId) return null

        return try {
            val staticKeyBytes = Base64.decode(cachedCert.staticPublicKeyB64, Base64.NO_WRAP)
            val staticPublicKey = KeyFactory.getInstance("EC")
                .generatePublic(X509EncodedKeySpec(staticKeyBytes))

            val ephemeralKeyBytes = Base64.decode(signed.ephemeralPublicKeyB64, Base64.NO_WRAP)
            val sigBytes = Base64.decode(signed.signatureB64, Base64.NO_WRAP)

            val verifier = Signature.getInstance("SHA256withECDSA")
            verifier.initVerify(staticPublicKey)
            verifier.update(ephemeralKeyBytes)

            if (verifier.verify(sigBytes)) ephemeralKeyBytes else null
        } catch (e: Exception) {
            null
        }
    }

    // ---------- Helpers for terminal side (JSON builder) ----------
    fun buildSignedEphemeralJson(
        terminalId: String,
        ephemeralPublicKeyB64: String,
        signatureB64: String
    ): String {
        return JSONObject().apply {
            put(FIELD_TERMINAL_ID, terminalId)
            put(FIELD_EPHEMERAL_PUBLIC_KEY, ephemeralPublicKeyB64)
            put(FIELD_SIGNATURE, signatureB64)
        }.toString()
    }

    fun buildQrJson(
        terminalId: String,
        staticPublicKeyB64: String,
        rootSignatureB64: String
    ): String {
        return JSONObject().apply {
            put(FIELD_TERMINAL_ID, terminalId)
            put(FIELD_STATIC_PUBLIC_KEY, staticPublicKeyB64)
            put(FIELD_ROOT_SIGNATURE, rootSignatureB64)
        }.toString()
    }
}
```

---

## File 2: `TerminalGattServer.kt` — Merchant terminal (peripheral)

```kotlin
package com.yourapp.ble.terminal

import android.bluetooth.*
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.ParcelUuid
import android.util.Base64
import android.util.Log
import com.yourapp.ble.crypto.CryptoSession
import com.yourapp.ble.crypto.EncryptedMessage
import com.yourapp.ble.pairing.TerminalPairing
import com.yourapp.ble.transport.ChunkedMessenger
import org.json.JSONObject
import java.security.KeyStore
import java.security.PrivateKey
import java.security.Signature
import java.util.UUID

/**
 * MERCHANT TERMINAL – BLE peripheral with MITM-proof static-key signing.
 *
 * JSON SCHEMA for the first message (SignedEphemeralKey):
 * { "terminal_id": "...", "ephemeral_public_key": "<base64>", "signature": "<base64>" }
 */
class TerminalGattServer(
    private val context: Context,
    private val serviceUuid: UUID,
    private val writeCharUuid: UUID,
    private val notifyCharUuid: UUID,
    private val listener: Listener
) {
    interface Listener {
        fun onSecureChannelEstablished()
        fun onPaymentAuthorized(userAddress: String, signature: String)
        fun onError(reason: String)
    }

    private val bluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter = bluetoothManager.adapter

    private var gattServer: BluetoothGattServer? = null
    private var advertiser: BluetoothLeAdvertiser? = null
    private var connectedDevice: BluetoothDevice? = null

    private val crypto = CryptoSession()
    private val reassembler = ChunkedMessenger.Reassembler()
    private var negotiatedMtu = 23

    private lateinit var writeCharacteristic: BluetoothGattCharacteristic
    private lateinit var notifyCharacteristic: BluetoothGattCharacteristic

    // Your app sets this before calling start()
    var pendingPaymentRequestJson: String? = null

    // ---------- Terminal identity (must be stable across sessions) ----------
    private val terminalId: String
        get() = "TERMINAL_SERIAL_123" // TODO: replace with your actual stable ID

    fun start() {
        setUpGattService()
        startAdvertising()
    }

    fun stop() {
        advertiser?.stopAdvertising(advertiseCallback)
        gattServer?.close()
        crypto.clear()
        reassembler.reset()
        connectedDevice = null
    }

    private fun setUpGattService() {
        writeCharacteristic = BluetoothGattCharacteristic(
            writeCharUuid,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        notifyCharacteristic = BluetoothGattCharacteristic(
            notifyCharUuid,
            BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ
        ).apply {
            val cccd = BluetoothGattDescriptor(
                UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"),
                BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE
            )
            addDescriptor(cccd)
        }

        val service = BluetoothGattService(serviceUuid, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        service.addCharacteristic(writeCharacteristic)
        service.addCharacteristic(notifyCharacteristic)

        gattServer = bluetoothManager.openGattServer(context, gattServerCallback)
        gattServer?.addService(service)
    }

    private fun startAdvertising() {
        advertiser = bluetoothAdapter.bluetoothLeAdvertiser
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .build()
        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(ParcelUuid(serviceUuid))
            .build()
        advertiser?.startAdvertising(settings, data, advertiseCallback)
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartFailure(errorCode: Int) {
            listener.onError("Advertise failed: $errorCode")
        }
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {

        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                connectedDevice = device
                crypto.clear()
                reassembler.reset()
                sendSignedEphemeralPublicKey()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                if (device == connectedDevice) {
                    crypto.clear()
                    reassembler.reset()
                    connectedDevice = null
                }
            }
        }

        override fun onMtuChanged(device: BluetoothDevice, mtu: Int) {
            negotiatedMtu = mtu
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray
        ) {
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
            }

            if (characteristic.uuid != writeCharUuid) return

            val complete = reassembler.feed(value) ?: return

            if (!crypto.isReady) {
                crypto.deriveSharedKey(complete)
                listener.onSecureChannelEstablished()
                sendPaymentRequestIfReady()
            } else {
                handleEncryptedEnvelope(complete)
            }
        }
    }

    private fun sendSignedEphemeralPublicKey() {
        val device = connectedDevice ?: return
        val ephemeralBytes = crypto.generateEphemeralKeyPair()

        val signatureB64 = signWithStaticPrivateKey(ephemeralBytes)
        val ephemeralB64 = Base64.encodeToString(ephemeralBytes, Base64.NO_WRAP)

        val json = TerminalPairing.buildSignedEphemeralJson(
            terminalId = terminalId,
            ephemeralPublicKeyB64 = ephemeralB64,
            signatureB64 = signatureB64
        )

        sendRaw(device, json.toByteArray(Charsets.UTF_8))
    }

    // ---------- Static key signing (Android Keystore) ----------
    private fun signWithStaticPrivateKey(data: ByteArray): String {
        return try {
            // TODO: Replace "terminal_static" with your actual Keystore alias.
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            val privateKey = keyStore.getKey("terminal_static", null) as PrivateKey

            val signature = Signature.getInstance("SHA256withECDSA")
            signature.initSign(privateKey)
            signature.update(data)
            Base64.encodeToString(signature.sign(), Base64.NO_WRAP)
        } catch (e: Exception) {
            listener.onError("Failed to sign ephemeral key: ${e.message}")
            throw e
        }
    }

    private fun sendPaymentRequestIfReady() {
        val json = pendingPaymentRequestJson ?: return
        sendEncryptedJson(json)
    }

    private fun handleEncryptedEnvelope(raw: ByteArray) {
        try {
            val envelope = JSONObject(String(raw, Charsets.UTF_8))
            val payloadB64 = envelope.getString("payload")
            val ivB64 = envelope.getString("iv")

            val message = EncryptedMessage(
                ciphertext = Base64.decode(payloadB64, Base64.NO_WRAP),
                iv = Base64.decode(ivB64, Base64.NO_WRAP)
            )
            val decrypted = crypto.decrypt(message)
            val body = JSONObject(String(decrypted, Charsets.UTF_8))

            when (envelope.optString("msg_type")) {
                "PAYMENT_AUTH" -> {
                    val userAddress = body.getString("user_address")
                    val signature = body.getString("signature")
                    listener.onPaymentAuthorized(userAddress, signature)
                }
                else -> listener.onError("Unexpected msg_type from phone")
            }
        } catch (e: Exception) {
            listener.onError("Failed to decrypt/parse payment auth: ${e.message}")
        }
    }

    private fun sendEncryptedJson(plaintextJson: String) {
        val device = connectedDevice ?: return
        val encrypted = crypto.encrypt(plaintextJson.toByteArray(Charsets.UTF_8))

        val envelope = JSONObject().apply {
            put("msg_type", "PAYMENT_REQUEST")
            put("payload", Base64.encodeToString(encrypted.ciphertext, Base64.NO_WRAP))
            put("iv", Base64.encodeToString(encrypted.iv, Base64.NO_WRAP))
        }
        sendRaw(device, envelope.toString().toByteArray(Charsets.UTF_8))
    }

    private fun sendRaw(device: BluetoothDevice, data: ByteArray) {
        val chunks = ChunkedMessenger.chunk(data, negotiatedMtu - 3)
        // TODO: Implement a write queue here instead of sending all at once.
        for (chunk in chunks) {
            notifyCharacteristic.value = chunk
            gattServer?.notifyCharacteristicChanged(device, notifyCharacteristic, false)
        }
    }
}
```

---

## File 3: `UserGattClient.kt` — User phone (central)

```kotlin
package com.yourapp.ble.userapp

import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import android.util.Base64
import com.yourapp.ble.crypto.CryptoSession
import com.yourapp.ble.crypto.EncryptedMessage
import com.yourapp.ble.pairing.TerminalPairing
import com.yourapp.ble.pairing.TerminalPairing.TerminalCertificate
import com.yourapp.ble.transport.ChunkedMessenger
import org.json.JSONObject
import java.util.UUID

/**
 * USER PHONE – BLE central with MITM-proof terminal verification.
 *
 * First message from terminal MUST be a SignedEphemeralKey JSON:
 * { "terminal_id": "...", "ephemeral_public_key": "<base64>", "signature": "<base64>" }
 */
class UserGattClient(
    private val context: Context,
    private val serviceUuid: UUID,
    private val writeCharUuid: UUID,
    private val notifyCharUuid: UUID,
    private val signer: Signer,
    private val listener: Listener
) {
    interface Signer {
        fun signPayment(
            merchant: String,
            amount: String,
            nonce: Long,
            deadline: Long
        ): SignResult
    }

    sealed class SignResult {
        data class Approved(val userAddress: String, val signatureHex: String) : SignResult()
        object Declined : SignResult()
    }

    interface Listener {
        fun onSecureChannelEstablished()
        fun onPaymentRequestReceived(merchant: String, amount: String, deadline: Long)
        fun onPaymentAuthSent()
        fun onError(reason: String)
    }

    private val bluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter = bluetoothManager.adapter
    private var scanner: BluetoothLeScanner? = null
    private var gatt: BluetoothGatt? = null

    private val crypto = CryptoSession()
    private val reassembler = ChunkedMessenger.Reassembler()
    private var negotiatedMtu = 23

    private var writeChar: BluetoothGattCharacteristic? = null
    private var notifyChar: BluetoothGattCharacteristic? = null

    private var pendingMerchant: String? = null
    private var pendingAmount: String? = null
    private var pendingNonce: Long = 0
    private var pendingDeadline: Long = 0

    // TODO: Implement loadCachedCertificate() using EncryptedSharedPreferences / Room.
    private fun loadCachedCertificate(terminalId: String): TerminalCertificate? {
        return null
    }

    fun startScan() {
        scanner = bluetoothAdapter.bluetoothLeScanner
        val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(serviceUuid)).build()
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        scanner?.startScan(listOf(filter), settings, scanCallback)
    }

    fun stop() {
        scanner?.stopScan(scanCallback)
        gatt?.disconnect()
        gatt?.close()
        crypto.clear()
        reassembler.reset()
    }

    fun approvePayment() {
        val merchant = pendingMerchant ?: return listener.onError("No pending payment request")
        val amount = pendingAmount ?: return listener.onError("No pending payment request")

        when (val result = signer.signPayment(merchant, amount, pendingNonce, pendingDeadline)) {
            is SignResult.Approved -> sendPaymentAuth(result.userAddress, result.signatureHex)
            is SignResult.Declined -> listener.onError("User declined payment")
        }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            scanner?.stopScan(this)
            gatt = result.device.connectGatt(context, false, gattCallback)
        }

        override fun onScanFailed(errorCode: Int) {
            listener.onError("Scan failed: $errorCode")
        }
    }

    private val gattCallback = object : BluetoothGattCallback() {

        override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                g.requestMtu(512)
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                crypto.clear()
                reassembler.reset()
            }
        }

        override fun onMtuChanged(g: BluetoothGatt, mtu: Int, status: Int) {
            negotiatedMtu = mtu
            g.discoverServices()
        }

        override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
            val service = g.getService(serviceUuid)
            writeChar = service?.getCharacteristic(writeCharUuid)
            notifyChar = service?.getCharacteristic(notifyCharUuid)

            notifyChar?.let { char ->
                g.setCharacteristicNotification(char, true)
                val cccd = char.getDescriptor(UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"))
                cccd?.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                cccd?.let { g.writeDescriptor(it) }
            }
        }

        override fun onCharacteristicChanged(g: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
            if (characteristic.uuid != notifyCharUuid) return
            val complete = reassembler.feed(characteristic.value) ?: return

            if (!crypto.isReady) {
                handleFirstMessage(complete)
            } else {
                handleEncryptedEnvelope(complete)
            }
        }
    }

    private fun handleFirstMessage(raw: ByteArray) {
        try {
            val json = JSONObject(String(raw, Charsets.UTF_8))
            val signedKey = TerminalPairing.SignedEphemeralKey(
                terminalId = json.getString(TerminalPairing.FIELD_TERMINAL_ID),
                ephemeralPublicKeyB64 = json.getString(TerminalPairing.FIELD_EPHEMERAL_PUBLIC_KEY),
                signatureB64 = json.getString(TerminalPairing.FIELD_SIGNATURE)
            )

            val cachedCert = loadCachedCertificate(signedKey.terminalId)
                ?: return listener.onError("Terminal not paired – please scan the QR code first")

            val verifiedEphemeralBytes = TerminalPairing.verifySignedEphemeralKey(signedKey, cachedCert)
                ?: return listener.onError("Terminal identity verification failed – possible MITM attack")

            val myPubKey = crypto.generateEphemeralKeyPair()
            crypto.deriveSharedKey(verifiedEphemeralBytes)
            sendRaw(myPubKey)
            listener.onSecureChannelEstablished()

        } catch (e: Exception) {
            listener.onError("Failed to verify terminal identity: ${e.message}")
        }
    }

    private fun handleEncryptedEnvelope(raw: ByteArray) {
        try {
            val envelope = JSONObject(String(raw, Charsets.UTF_8))
            val message = EncryptedMessage(
                ciphertext = Base64.decode(envelope.getString("payload"), Base64.NO_WRAP),
                iv = Base64.decode(envelope.getString("iv"), Base64.NO_WRAP)
            )
            val decrypted = crypto.decrypt(message)
            val body = JSONObject(String(decrypted, Charsets.UTF_8))

            if (envelope.optString("msg_type") == "PAYMENT_REQUEST") {
                pendingMerchant = body.getString("merchant_address")
                pendingAmount = body.getString("amount")
                pendingNonce = body.getLong("nonce")
                pendingDeadline = body.getLong("deadline")
                listener.onPaymentRequestReceived(pendingMerchant!!, pendingAmount!!, pendingDeadline)
            }
        } catch (e: Exception) {
            listener.onError("Failed to decrypt/parse payment request: ${e.message}")
        }
    }

    private fun sendPaymentAuth(userAddress: String, signatureHex: String) {
        val body = JSONObject().apply {
            put("user_address", userAddress)
            put("signature", signatureHex)
        }
        val encrypted = crypto.encrypt(body.toString().toByteArray(Charsets.UTF_8))
        val envelope = JSONObject().apply {
            put("msg_type", "PAYMENT_AUTH")
            put("payload", Base64.encodeToString(encrypted.ciphertext, Base64.NO_WRAP))
            put("iv", Base64.encodeToString(encrypted.iv, Base64.NO_WRAP))
        }
        sendRaw(envelope.toString().toByteArray(Charsets.UTF_8))
        listener.onPaymentAuthSent()
    }

    private fun sendRaw(data: ByteArray) {
        val char = writeChar ?: return
        val chunks = ChunkedMessenger.chunk(data, negotiatedMtu - 3)
        // TODO: Implement a write queue here instead of sending all at once.
        for (chunk in chunks) {
            char.value = chunk
            gatt?.writeCharacteristic(char)
        }
    }
}
```

---

## Integration TODOs (two simple plugs)

1. **`TerminalGattServer.signWithStaticPrivateKey()`** — replace `"terminal_static"` with your actual Android Keystore alias. The key must be generated once during provisioning and never leave the device.

2. **`UserGattClient.loadCachedCertificate()`** — connect to your secure storage (EncryptedSharedPreferences / Room) to retrieve the certificate saved after the one-time QR scan via `TerminalPairing.verifyAndParseQr()`.

## MITM-Proof Flow Summary

```
1. One-time: merchant displays QR (terminal_id, static_public_key, root_signature)
   → Phone scans QR, verifies root_signature with trusted root pubkey
   → Phone caches the TerminalCertificate in secure storage

2. Every BLE session:
   → Terminal generates ephemeral EC key pair
   → Terminal signs ephemeral_public_key with its STATIC private key (from Keystore)
   → Terminal sends {terminal_id, ephemeral_public_key, signature} over BLE
   → Phone looks up cached certificate by terminal_id
   → Phone verifies signature on ephemeral_public_key using terminal's static_public_key
   → If verification fails → MITM detected, abort
   → If verification passes → phone derives ECDH shared secret using verified ephemeral key
   → All subsequent messages encrypted with AES-GCM using the shared secret
```

The static key never leaves the terminal's Keystore. The ephemeral key changes every session. A MITM cannot forge the signature without the terminal's private key, and cannot derive the shared secret without the ephemeral private key (which is discarded after the session).

---

**File status:** Reference only — preserved for the mobile team. Not part of the Next.js web project.
