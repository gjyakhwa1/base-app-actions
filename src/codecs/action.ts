import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

export const ContentTypeActions = new ContentTypeId({
  authorityId: "coinbase.com",
  typeId: "actions",
  versionMajor: 1,
  versionMinor: 0,
});

export type Action = {
  id: string;
  label: string;
  imageUrl?: string;
  style?: "primary" | "secondary" | "danger";
  expiresAt?: string;
};

export type ActionsContent = {
  id: string;
  description: string;
  actions: Action[];
  expiresAt?: string;
};

export class ActionsContentCodec implements ContentCodec<ActionsContent> {
  get contentType(): ContentTypeId {
    return ContentTypeActions;
  }

  encode(content: ActionsContent): EncodedContent {
    return {
      type: ContentTypeActions,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(encodedContent: EncodedContent): ActionsContent {
    const uint8Array = encodedContent.content;
    return JSON.parse(new TextDecoder().decode(uint8Array)) as ActionsContent;
  }

  fallback(content: ActionsContent): string | undefined {
    return `[ActionsContent]: ${JSON.stringify(content)}`;
  }

  shouldPush() {
    return true;
  }
}
