export type SmsContact = {
  id: string;
  firstName: string;
  lastName: string;
};

export type SmsCompany = {
  id: string;
  name: string;
};

export type SmsMessage = {
  id: string;
  conversationId?: string;
  body: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: string;
  occurredAt: string;
};

export type SmsConversation = {
  id: string;
  phoneE164: string;
  status: string;
  lastMessageAt: string | null;
  person: SmsContact | null;
  company: SmsCompany | null;
  latestMessage: SmsMessage | null;
};

export const createSmsIdempotencyKey = (
  timestamp = Date.now(),
  randomValue = Math.random(),
): string => {
  const randomSuffix = randomValue.toString(36).slice(2) || '0';

  return `sms-inbox:${timestamp}:${randomSuffix}`;
};

const getPersonName = (person: SmsContact | null): string =>
  [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();

export const getSmsConversationDisplayName = (
  conversation: SmsConversation,
): string => {
  const personName = getPersonName(conversation.person);

  if (personName !== '') {
    return personName;
  }

  const companyName = conversation.company?.name.trim() ?? '';

  return companyName !== '' ? companyName : conversation.phoneE164;
};

export const getSmsConversationPreview = (
  conversation: SmsConversation,
): string => {
  const messageBody = conversation.latestMessage?.body.trim() ?? '';

  return messageBody !== '' ? messageBody : 'No messages yet';
};

export const filterSmsConversations = (
  conversations: SmsConversation[],
  searchTerm: string,
): SmsConversation[] => {
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();

  if (normalizedSearchTerm === '') {
    return conversations;
  }

  return conversations.filter((conversation) =>
    [
      getSmsConversationDisplayName(conversation),
      conversation.company?.name ?? '',
      conversation.phoneE164,
      getSmsConversationPreview(conversation),
    ].some((value) =>
      value.toLocaleLowerCase().includes(normalizedSearchTerm),
    ),
  );
};
