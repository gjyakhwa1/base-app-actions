//https://github.com/HeyElsa/xmtp-js/tree/main/content-types/content-type-wallet-send-calls

import { Client, type XmtpEnv} from "@xmtp/node-sdk";
import {
  createSigner,
  getEncryptionKeyFromHex,
  validateEnvironment,
} from "@/helpers/client.js";
import { WalletSendCallsCodec, WalletSendCallsParams, ContentTypeWalletSendCalls } from "@xmtp/content-type-wallet-send-calls";



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
    codecs:[new WalletSendCallsCodec()]
  });


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
    const walletSendCalls: WalletSendCallsParams = {
      version: "1.0",
      from: "0x123...abc",
      chainId: "0x2105",
      calls: [
        {
          to: "0x456...def",
          value: "0x5AF3107A4000",
          metadata: {
            description: "Send 0.0001 ETH on base to 0x456...def",
            transactionType: "transfer",
            currency: "ETH",
            amount: "100000000000000",
            decimals: "18",
            toAddress: "0x456...def",
          },
        },
        {
          to: "0x789...cba",
          data: "0xdead...beef",
          metadata: {
            description: "Lend 10 USDC on base with Morpho @ 8.5% APY",
            transactionType: "lend",
            currency: "USDC",
            amount: "10000000",
            decimals: "6",
            platform: "morpho",
            apy: "8.5",
          },
        },
      ],
    };
    await conversation.send(walletSendCalls, ContentTypeWalletSendCalls)
  }
  console.log("Message stream started");
}

main().catch(console.error);