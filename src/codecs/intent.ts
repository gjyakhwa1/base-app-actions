import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

export const ContentTypeIntent = new ContentTypeId({
  authorityId: "coinbase.com",
  typeId: "intent",
  versionMajor: 1,
  versionMinor: 0,
});

export type IntentContent = {
  id: string;
  actionId: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export class IntentContentCodec implements ContentCodec<IntentContent> {
  get contentType(): ContentTypeId {
    return ContentTypeIntent;
  }

  encode(content: IntentContent): EncodedContent {
    return {
      type: ContentTypeIntent,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(encodedContent: EncodedContent): IntentContent {
    const uint8Array = encodedContent.content;
    return JSON.parse(new TextDecoder().decode(uint8Array)) as IntentContent;
  }

  fallback(content: IntentContent): string | undefined {
    return `[IntentContent]: ${JSON.stringify(content)}`;
  }

  shouldPush() {
    return true;
  }
}
