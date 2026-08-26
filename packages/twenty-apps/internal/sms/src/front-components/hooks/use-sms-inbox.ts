import { useCallback, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import {
  createSmsIdempotencyKey,
  type SmsConversation,
  type SmsMessage,
} from 'src/front-components/utils/sms-inbox';

type SmsConversationQueryNode = {
  id?: string;
  phoneE164?: string;
  status?: string;
  lastMessageAt?: string | null;
  person?: {
    id?: string;
    name?: { firstName?: string | null; lastName?: string | null } | null;
  } | null;
  company?: { id?: string; name?: string | null } | null;
};

type SmsMessageQueryNode = {
  id?: string;
  conversationId?: string | null;
  body?: string;
  direction?: string;
  status?: string;
  occurredAt?: string;
};

type SmsInboxQueryResult = {
  smsConversations?: {
    edges?: Array<{ node?: SmsConversationQueryNode | null }>;
  };
  smsMessages?: {
    edges?: Array<{ node?: SmsMessageQueryNode | null }>;
  };
};

type SendSmsResponse = {
  success: boolean;
  providerMessageId?: string;
  error?: string;
};

type SmsInboxState = {
  conversations: SmsConversation[];
  messages: SmsMessage[];
  isLoading: boolean;
  isSending: boolean;
  errorMessage: string | null;
};

const INBOX_REFRESH_INTERVAL_MS = 10_000;
const CONVERSATION_PAGE_SIZE = 100;
const MESSAGE_PAGE_SIZE = 500;

const toSmsMessage = (
  node: SmsMessageQueryNode | null | undefined,
): SmsMessage | null => {
  if (
    typeof node?.id !== 'string' ||
    typeof node.body !== 'string' ||
    typeof node.direction !== 'string' ||
    typeof node.status !== 'string' ||
    typeof node.occurredAt !== 'string' ||
    (node.direction !== 'INBOUND' && node.direction !== 'OUTBOUND')
  ) {
    return null;
  }

  return {
    id: node.id,
    ...(typeof node.conversationId === 'string'
      ? { conversationId: node.conversationId }
      : {}),
    body: node.body,
    direction: node.direction,
    status: node.status,
    occurredAt: node.occurredAt,
  };
};

const toSmsConversation = (
  node: SmsConversationQueryNode | null | undefined,
  latestMessage: SmsMessage | null,
): SmsConversation | null => {
  if (
    typeof node?.id !== 'string' ||
    typeof node.phoneE164 !== 'string' ||
    typeof node.status !== 'string'
  ) {
    return null;
  }

  const person =
    typeof node.person?.id === 'string'
      ? {
          id: node.person.id,
          firstName: node.person.name?.firstName ?? '',
          lastName: node.person.name?.lastName ?? '',
        }
      : null;
  const company =
    typeof node.company?.id === 'string'
      ? { id: node.company.id, name: node.company.name ?? '' }
      : null;

  return {
    id: node.id,
    phoneE164: node.phoneE164,
    status: node.status,
    lastMessageAt:
      typeof node.lastMessageAt === 'string' ? node.lastMessageAt : null,
    person,
    company,
    latestMessage,
  };
};

const fetchSmsInbox = async (): Promise<{
  conversations: SmsConversation[];
  messages: SmsMessage[];
}> => {
  const client = new CoreApiClient();
  const result = (await client.query({
    smsConversations: {
      __args: {
        first: CONVERSATION_PAGE_SIZE,
        orderBy: [{ lastMessageAt: 'DescNullsLast' }],
      },
      edges: {
        node: {
          id: true,
          phoneE164: true,
          status: true,
          lastMessageAt: true,
          person: {
            id: true,
            name: { firstName: true, lastName: true },
          },
          company: { id: true, name: true },
        },
      },
    },
    smsMessages: {
      __args: {
        first: MESSAGE_PAGE_SIZE,
        orderBy: [{ occurredAt: 'DescNullsLast' }],
      },
      edges: {
        node: {
          id: true,
          conversationId: true,
          body: true,
          direction: true,
          status: true,
          occurredAt: true,
        },
      },
    },
  })) as unknown as SmsInboxQueryResult;

  const messages = (result.smsMessages?.edges ?? [])
    .map((edge) => toSmsMessage(edge.node))
    .filter((message): message is SmsMessage => message !== null);
  const latestMessageByConversationId = new Map<string, SmsMessage>();

  for (const message of messages) {
    if (
      message.conversationId !== undefined &&
      !latestMessageByConversationId.has(message.conversationId)
    ) {
      latestMessageByConversationId.set(message.conversationId, message);
    }
  }

  const conversations = (result.smsConversations?.edges ?? [])
    .map((edge) => {
      const conversationId = edge.node?.id;

      return toSmsConversation(
        edge.node,
        typeof conversationId === 'string'
          ? (latestMessageByConversationId.get(conversationId) ?? null)
          : null,
      );
    })
    .filter(
      (conversation): conversation is SmsConversation => conversation !== null,
    );

  return { conversations, messages };
};

export const useSmsInbox = () => {
  const [state, setState] = useState<SmsInboxState>({
    conversations: [],
    messages: [],
    isLoading: true,
    isSending: false,
    errorMessage: null,
  });

  const refreshInbox = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setState((currentState) => ({
        ...currentState,
        isLoading: true,
        errorMessage: null,
      }));
    }

    try {
      const inbox = await fetchSmsInbox();

      setState((currentState) => ({
        ...currentState,
        ...inbox,
        isLoading: false,
        errorMessage: null,
      }));
    } catch {
      setState((currentState) => ({
        ...currentState,
        isLoading: false,
        errorMessage:
          'Messages could not be loaded. Check your connection and try again.',
      }));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshWhileMounted = async (showLoading = false) => {
      if (isMounted) {
        await refreshInbox(showLoading);
      }
    };

    void refreshWhileMounted(true);
    const refreshInterval = setInterval(() => {
      void refreshWhileMounted();
    }, INBOX_REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [refreshInbox]);

  const sendMessage = useCallback(
    async ({ toNumber, text }: { toNumber: string; text: string }) => {
      setState((currentState) => ({
        ...currentState,
        isSending: true,
        errorMessage: null,
      }));

      try {
        const result = await new RestApiClient().post<SendSmsResponse>(
          '/s/sms/send',
          {
            toNumber,
            text,
            idempotencyKey: createSmsIdempotencyKey(),
          },
        );

        if (!result.success) {
          throw new Error(result.error ?? 'The message could not be sent.');
        }

        await refreshInbox();
        await enqueueSnackbar({
          message: 'Message sent.',
          variant: 'success',
        });

        setState((currentState) => ({
          ...currentState,
          isSending: false,
        }));

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'The message could not be sent. Try again.';

        setState((currentState) => ({
          ...currentState,
          isSending: false,
          errorMessage,
        }));
        await enqueueSnackbar({ message: errorMessage, variant: 'error' });

        return false;
      }
    },
    [refreshInbox],
  );

  return { ...state, refreshInbox, sendMessage };
};
