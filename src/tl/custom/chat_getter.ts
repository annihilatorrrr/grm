import { getPeerId } from "../../utils.ts";
import { Api } from "../api.js";
import { returnBigInt } from "../../helpers.ts";
import type { Entity, EntityLike } from "../../define.d.ts";
import type { TelegramClient } from "../../client/telegram_client.ts";

export interface ChatGetterConstructorParams {
  chatPeer?: EntityLike;
  inputChat?: EntityLike;
  chat?: EntityLike;
  broadcast?: boolean;
}

export class ChatGetter {
  _chatPeer?: EntityLike;
  _inputChat?: EntityLike;
  _chat?: Entity;
  _broadcast?: boolean;
  public _client?: TelegramClient;

  static initChatClass(
    // deno-lint-ignore no-explicit-any
    c: any,
    { chatPeer, inputChat, chat, broadcast }: ChatGetterConstructorParams,
  ) {
    c._chatPeer = chatPeer;
    c._inputChat = inputChat;
    c._chat = chat;
    c._broadcast = broadcast;
    c._client = undefined;
  }

  get chat() {
    return this._chat;
  }

  async getChat() {
    if (!this._chat || ("min" in this._chat && (await this.getInputChat()))) {
      try {
        if (this._inputChat) {
          this._chat = await this._client?.getEntity(this._inputChat);
        }
      } catch (_e) {
        await this._refetchChat();
      }
    }
    return this._chat;
  }

  get inputChat() {
    if (!this._inputChat && this._chatPeer && this._client) {
      try {
        this._inputChat = this._client._entityCache.get(
          getPeerId(this._chatPeer),
        );
      } catch (_e) {
        //
      }
    }
    return this._inputChat;
  }

  async getInputChat() {
    if (!this.inputChat && this.chatId && this._client) {
      try {
        const target = this.chatId;
        for await (
          const dialog of this._client.iterDialogs({ limit: 100 })
        ) {
          if (dialog.id!.eq(target!)) {
            this._chat = dialog.entity;
            this._inputChat = dialog.inputEntity;
            break;
          }
        }
      } catch (_e) {
        // do nothing
      }
      return this._inputChat;
    }
    return this._inputChat;
  }

  get chatId() {
    return this._chatPeer ? returnBigInt(getPeerId(this._chatPeer)) : undefined;
  }

  get isPrivate() {
    return this._chatPeer ? this._chatPeer instanceof Api.PeerUser : undefined;
  }

  get isGroup() {
    if (!this._broadcast && this.chat && "broadcast" in this.chat) {
      this._broadcast = Boolean(this.chat.broadcast);
    }
    if (this._chatPeer instanceof Api.PeerChannel) {
      if (this._broadcast === undefined) {
        // deno-lint-ignore getter-return
        return;
      } else {
        return !this._broadcast;
      }
    }
    return this._chatPeer instanceof Api.PeerChat;
  }

  get isChannel() {
    return this._chatPeer instanceof Api.PeerChannel;
  }

  async _refetchChat() {}
}
