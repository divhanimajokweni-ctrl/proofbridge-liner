# BLE Write Queue — Kotlin Reference Implementation

**Status:** Production-ready reference for the VVU mobile transport layer
**Date preserved:** 2026-08-25
**Source:** User-supplied Kotlin code (battle-tested Android Bluetooth stack handling)
**Target:** `com.yourapp.ble.transport` package (mobile team to integrate)

---

## 1. The Queue Implementation

Save as `BleWriteQueue.kt` in the BLE transport package:

```kotlin
package com.yourapp.ble.transport

import android.os.Handler
import android.os.Looper
import android.util.Log
import java.util.LinkedList
import java.util.Queue

/**
 * Ensures BLE chunks are sent strictly sequentially, waiting for hardware callbacks.
 *
 * Android will silently drop packets or return `false` if you try to push data
 * into the BLE binder faster than the hardware can transmit it. This queue
 * handles strict sequential writing and includes an automatic retry mechanism
 * if the Android stack temporarily rejects a write.
 */
class BleWriteQueue(
    private val executeWrite: (ByteArray) -> Boolean
) {
    private val queue: Queue<ByteArray> = LinkedList()
    private var isWriting = false
    private val handler = Handler(Looper.getMainLooper())

    /**
     * Adds chunks to the queue and starts pumping if idle.
     */
    @Synchronized
    fun enqueue(chunks: List<ByteArray>) {
        queue.addAll(chunks)
        pump()
    }

    /**
     * MUST be called from onCharacteristicWrite (Client) or onNotificationSent (Server)
     * to signal that the hardware is ready for the next chunk.
     */
    @Synchronized
    fun onWriteCompleted() {
        isWriting = false
        pump()
    }

    /**
     * Clears the queue. Call this on disconnection.
     */
    @Synchronized
    fun clear() {
        queue.clear()
        isWriting = false
        handler.removeCallbacksAndMessages(null)
    }

    private fun pump() {
        if (isWriting || queue.isEmpty()) return

        val chunk = queue.peek() ?: return
        isWriting = true

        val success = executeWrite(chunk)
        if (success) {
            // The BLE stack accepted the command. Remove from queue.
            queue.poll()
        } else {
            // The BLE stack's internal buffer is full (returned false).
            // Back off and retry the exact same chunk in 50ms.
            isWriting = false
            handler.postDelayed({ pump() }, 50)
        }
    }
}
```

---

## 2. Integration into `UserGattClient.kt` (Phone / Central role)

**Step A — Initialize the queue as a class property:**

```kotlin
private val writeQueue = BleWriteQueue { chunk ->
    val char = writeChar ?: return@BleWriteQueue false
    char.value = chunk
    // Returns true if the stack accepted it, false if busy
    gatt?.writeCharacteristic(char) == true
}
```

**Step B — Replace the `sendRaw` TODO:**

```kotlin
private fun sendRaw(data: ByteArray) {
    val chunks = ChunkedMessenger.chunk(data, negotiatedMtu - 3)
    // Replace the for-loop with this single line:
    writeQueue.enqueue(chunks)
}
```

**Step C — Clear the queue on disconnect:**

```kotlin
// Inside onConnectionStateChange, in the STATE_DISCONNECTED block:
} else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
    crypto.clear()
    reassembler.reset()
    writeQueue.clear() // <-- Add this
}
```

**Step D — Trigger `onWriteCompleted` from the GATT callback:**

```kotlin
// Add this override inside your BluetoothGattCallback:
override fun onCharacteristicWrite(
    g: BluetoothGatt,
    characteristic: BluetoothBluetoothGattCharacteristic,
    status: Int
) {
    if (status == BluetoothGatt.GATT_SUCCESS) {
        writeQueue.onWriteCompleted()
    } else {
        listener.onError("GATT write failed with status: $status")
        writeQueue.clear() // Abort the remaining chunks
    }
}
```

---

## 3. Integration into `TerminalGattServer.kt` (Merchant / Peripheral role)

The server side uses notifications instead of writes, but the queue logic is identical.

**Step A — Initialize the queue:**

```kotlin
private val writeQueue = BleWriteQueue { chunk ->
    val device = connectedDevice ?: return@BleWriteQueue false
    notifyCharacteristic.value = chunk
    // Returns true if the stack accepted it, false if busy
    gattServer?.notifyCharacteristicChanged(device, notifyCharacteristic, false) == true
}
```

**Step B — Replace the `sendRaw` TODO:**

```kotlin
private fun sendRaw(device: BluetoothDevice, data: ByteArray) {
    val chunks = ChunkedMessenger.chunk(data, negotiatedMtu - 3)
    // Replace the for-loop with this single line:
    writeQueue.enqueue(chunks)
}
```

**Step C — Clear the queue on disconnect:**

```kotlin
// Inside onConnectionStateChange, in the STATE_DISCONNECTED block:
} else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
    if (device == connectedDevice) {
        crypto.clear()
        reassembler.reset()
        writeQueue.clear() // <-- Add this
        connectedDevice = null
    }
}
```

**Step D — Trigger `onWriteCompleted` from the GATT server callback:**

```kotlin
// Add this override inside your BluetoothGattServerCallback:
override fun onNotificationSent(device: BluetoothDevice, status: Int) {
    if (status == BluetoothGatt.GATT_SUCCESS) {
        writeQueue.onWriteCompleted()
    } else {
        listener.onError("GATT notification failed with status: $status")
        writeQueue.clear()
    }
}
```

---

## 4. Why This Matters

Android's BLE stack has an internal buffer that silently drops packets if you
push writes faster than the hardware can transmit. The symptom is data
corruption at the application layer — chunks go missing, the reassembler
fails, the crypto layer sees truncated frames. This queue:

- **Strictly sequential** — never has more than one write in flight at a time
- **Backs off on `false`** — if the stack rejects a write, retries the same chunk in 50ms
- **Hardware-callback-driven** — `onWriteCompleted()` only fires when the GATT callback confirms success
- **Clears on disconnect** — no leaked chunks across sessions

This is a known Android BLE pain point. The 50ms backoff is empirically
tuned — short enough to keep throughput high, long enough to let the stack
drain its internal buffer.

---

## 5. Test Coverage Recommended

- **Happy path:** enqueue 10 chunks, all `executeWrite` return true → all 10 sent in order
- **Backoff:** enqueue 10 chunks, first `executeWrite` returns false → verify retry after 50ms
- **Interleaved:** enqueue, simulate `onWriteCompleted` at intervals → verify strict sequence
- **Clear mid-flight:** enqueue 10 chunks, call `clear()` after 3 sent → verify remaining 7 dropped
- **Disconnect:** enqueue 10 chunks, call `clear()` → verify no further `executeWrite` calls

---

**File status:** Reference only — preserved for the mobile team. Not part of the Next.js web project.
