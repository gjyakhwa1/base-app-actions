import { Client, type XmtpEnv } from "@xmtp/node-sdk";

import {
  ActionsContent,
  ActionsContentCodec,
  ContentTypeActions,
} from "@/codecs/action.js";
import { IntentContentCodec } from "@/codecs/intent.js";
import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from "@/helpers/client.js";

const { WALLET_KEY, ENCRYPTION_KEY, XMTP_ENV } = validateEnvironment([
  "WALLET_KEY",
  "ENCRYPTION_KEY",
  "XMTP_ENV",
]);

async function main() {
  if (!WALLET_KEY || !ENCRYPTION_KEY || !XMTP_ENV) {
    console.log(
      "Either Wallet Key, Encryption Key or XMTP Key not set in environment"
    );
    return;
  }
  const signer = createSigner(WALLET_KEY);
  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

  const client = await Client.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    codecs: [new ActionsContentCodec(), new IntentContentCodec()],
  });

  // void logAgentDetails(client);

  console.log("✓ Syncing conversations...");
  await client.conversations.sync();

  console.log("Waiting for messages...");
  const stream = await client.conversations.streamAllMessages();
  for await (const message of stream) {
    if (message?.senderInboxId === client.inboxId) continue;
    console.log(
      `Received message: ${message.content as string} by ${
        message.senderInboxId
      }`
    );
    const conversation = await client.conversations.getConversationById(
      message.conversationId
    );
    if (!conversation) {
      console.log("Unable to find conversation, skipping");
      continue;
    }
    const inboxState = await client.preferences.inboxStateFromInboxIds([
      message.senderInboxId,
    ]);
    const addressFromInboxId = inboxState[0]?.identifiers[0]?.identifier;
    console.log(`Sending "gm" response to ${addressFromInboxId}...`);
    await conversation.send("gm");
    const actions: ActionsContent = {
      id: "payment_alice_123",
      description: "Choose amount to send to Alice",
      actions: [
        { id: "send_10", label: "Send $10", style: "primary" },
        { id: "send_20", label: "Send $20", style: "primary" },
        { id: "custom_amount", label: "Custom Amount", style: "secondary" },
      ],
    };
    await conversation.send(actions, ContentTypeActions);
  }
}

main().catch(console.error);
