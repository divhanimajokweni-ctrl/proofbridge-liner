import { getTransportKind } from "../config";
import { createInMemoryTransport } from "./memory-impl";
import {
  createKafkaTransport
} from "./kafka-impl";
async function getTransport(consumerGroupId) {
  const kind = getTransportKind();
  switch (kind) {
    case "memory":
      return createInMemoryTransport();
    case "kafka":
    default:
      return createKafkaTransport(consumerGroupId);
  }
}
export {
  getTransport
};
