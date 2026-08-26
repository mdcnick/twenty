import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'twenty-sdk/front-component';

import { useSmsInbox } from 'src/front-components/hooks/use-sms-inbox';
import {
  filterSmsConversations,
  getSmsConversationDisplayName,
  getSmsConversationPreview,
  type SmsConversation,
  type SmsMessage,
} from 'src/front-components/utils/sms-inbox';

const SMS_INBOX_STYLES = `
  .sms-inbox-root {
    background: var(--sms-bg);
    color: var(--sms-text);
    display: flex;
    flex-direction: column;
    font-size: 13px;
    height: 100%;
    min-height: 520px;
    overflow: hidden;
    width: 100%;
  }

  .sms-inbox-root * { box-sizing: border-box; }
  .sms-inbox-root button,
  .sms-inbox-root input,
  .sms-inbox-root textarea { font: inherit; }

  .sms-inbox-topbar {
    align-items: center;
    background: var(--sms-panel);
    border-bottom: 1px solid var(--sms-border);
    display: flex;
    flex: 0 0 56px;
    justify-content: space-between;
    padding: 0 16px 0 20px;
  }

  .sms-inbox-heading { min-width: 0; }
  .sms-inbox-heading h1 {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 20px;
    margin: 0;
  }
  .sms-inbox-heading p {
    color: var(--sms-text-secondary);
    font-size: 11px;
    line-height: 16px;
    margin: 1px 0 0;
  }

  .sms-inbox-primary-button,
  .sms-inbox-send-button {
    align-items: center;
    background: var(--sms-accent);
    border: 0;
    border-radius: 7px;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    font-size: 12px;
    font-weight: 600;
    justify-content: center;
    min-height: 32px;
    padding: 0 12px;
  }
  .sms-inbox-primary-button:hover,
  .sms-inbox-send-button:hover { background: var(--sms-accent-hover); }
  .sms-inbox-primary-button:focus-visible,
  .sms-inbox-send-button:focus-visible,
  .sms-inbox-secondary-button:focus-visible,
  .sms-inbox-conversation:focus-visible,
  .sms-inbox-search:focus-visible,
  .sms-inbox-phone-input:focus-visible,
  .sms-inbox-composer textarea:focus-visible {
    outline: 2px solid var(--sms-focus);
    outline-offset: 2px;
  }
  .sms-inbox-send-button:disabled {
    background: var(--sms-disabled);
    color: var(--sms-text-tertiary);
    cursor: not-allowed;
  }

  .sms-inbox-error {
    align-items: center;
    background: var(--sms-error-bg);
    border-bottom: 1px solid var(--sms-error-border);
    color: var(--sms-error-text);
    display: flex;
    font-size: 12px;
    justify-content: space-between;
    min-height: 40px;
    padding: 8px 14px;
  }
  .sms-inbox-error button {
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    font-weight: 600;
    padding: 4px 6px;
  }

  .sms-inbox-layout {
    display: grid;
    flex: 1;
    grid-template-columns: 320px minmax(360px, 1fr) 276px;
    min-height: 0;
  }

  .sms-inbox-sidebar,
  .sms-inbox-details {
    background: var(--sms-panel);
    min-height: 0;
  }
  .sms-inbox-sidebar {
    border-right: 1px solid var(--sms-border);
    display: flex;
    flex-direction: column;
  }
  .sms-inbox-details {
    border-left: 1px solid var(--sms-border);
    overflow: auto;
    padding: 20px;
  }

  .sms-inbox-search-wrap {
    border-bottom: 1px solid var(--sms-border);
    padding: 12px;
  }
  .sms-inbox-search {
    background: var(--sms-input);
    border: 1px solid var(--sms-border);
    border-radius: 8px;
    color: var(--sms-text);
    height: 34px;
    outline: none;
    padding: 0 11px;
    width: 100%;
  }
  .sms-inbox-search::placeholder,
  .sms-inbox-phone-input::placeholder,
  .sms-inbox-composer textarea::placeholder { color: var(--sms-text-tertiary); }

  .sms-inbox-list { flex: 1; min-height: 0; overflow: auto; padding: 6px; }
  .sms-inbox-conversation {
    align-items: flex-start;
    background: transparent;
    border: 0;
    border-radius: 9px;
    color: inherit;
    cursor: pointer;
    display: grid;
    gap: 10px;
    grid-template-columns: 36px minmax(0, 1fr) auto;
    padding: 10px;
    text-align: left;
    width: 100%;
  }
  .sms-inbox-conversation:hover { background: var(--sms-hover); }
  .sms-inbox-conversation[aria-selected="true"] { background: var(--sms-selected); }
  .sms-inbox-avatar {
    align-items: center;
    background: var(--sms-avatar);
    border-radius: 50%;
    color: var(--sms-avatar-text);
    display: flex;
    font-size: 11px;
    font-weight: 700;
    height: 36px;
    justify-content: center;
    letter-spacing: 0.02em;
    position: relative;
    width: 36px;
  }
  .sms-inbox-status-dot {
    background: var(--sms-success);
    border: 2px solid var(--sms-panel);
    border-radius: 50%;
    bottom: -1px;
    height: 9px;
    position: absolute;
    right: -1px;
    width: 9px;
  }
  .sms-inbox-status-dot[data-status="CLOSED"] { background: var(--sms-text-tertiary); }
  .sms-inbox-status-dot[data-status="SUPPRESSED"] { background: var(--sms-danger); }
  .sms-inbox-conversation-copy { min-width: 0; }
  .sms-inbox-conversation-name {
    display: block;
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sms-inbox-conversation-preview {
    color: var(--sms-text-secondary);
    display: block;
    font-size: 12px;
    line-height: 17px;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sms-inbox-conversation-time {
    color: var(--sms-text-tertiary);
    font-size: 10px;
    line-height: 18px;
    white-space: nowrap;
  }

  .sms-inbox-thread {
    background: var(--sms-thread);
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .sms-inbox-thread-header {
    align-items: center;
    background: var(--sms-panel);
    border-bottom: 1px solid var(--sms-border);
    display: flex;
    flex: 0 0 58px;
    gap: 10px;
    padding: 0 16px;
  }
  .sms-inbox-thread-header-copy { min-width: 0; }
  .sms-inbox-thread-name {
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sms-inbox-thread-phone {
    color: var(--sms-text-secondary);
    font-size: 11px;
    line-height: 16px;
  }
  .sms-inbox-secondary-button {
    background: transparent;
    border: 0;
    border-radius: 6px;
    color: var(--sms-text-secondary);
    cursor: pointer;
    display: none;
    padding: 6px 8px;
  }
  .sms-inbox-secondary-button:hover { background: var(--sms-hover); color: var(--sms-text); }

  .sms-inbox-new-recipient {
    background: var(--sms-panel);
    border-bottom: 1px solid var(--sms-border);
    padding: 10px 16px;
  }
  .sms-inbox-new-recipient label {
    color: var(--sms-text-secondary);
    display: block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-bottom: 5px;
    text-transform: uppercase;
  }
  .sms-inbox-phone-input {
    background: var(--sms-input);
    border: 1px solid var(--sms-border-strong);
    border-radius: 7px;
    color: var(--sms-text);
    height: 34px;
    outline: none;
    padding: 0 10px;
    width: 100%;
  }

  .sms-inbox-messages {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 24px clamp(18px, 4vw, 54px);
  }
  .sms-inbox-message-row { display: flex; margin: 5px 0; }
  .sms-inbox-message-row[data-direction="OUTBOUND"] { justify-content: flex-end; }
  .sms-inbox-bubble-wrap { max-width: min(72%, 560px); }
  .sms-inbox-bubble {
    background: var(--sms-incoming);
    border-radius: 14px 14px 14px 4px;
    color: var(--sms-text);
    font-size: 13px;
    line-height: 19px;
    overflow-wrap: anywhere;
    padding: 9px 12px;
    white-space: pre-wrap;
  }
  .sms-inbox-message-row[data-direction="OUTBOUND"] .sms-inbox-bubble {
    background: var(--sms-outgoing);
    border-radius: 14px 14px 4px 14px;
    color: #fff;
  }
  .sms-inbox-message-meta {
    color: var(--sms-text-tertiary);
    font-size: 10px;
    line-height: 15px;
    margin-top: 3px;
    padding: 0 3px;
  }
  .sms-inbox-message-row[data-direction="OUTBOUND"] .sms-inbox-message-meta { text-align: right; }
  .sms-inbox-message-meta[data-failed="true"] { color: var(--sms-danger); }
  .sms-inbox-day-separator {
    align-items: center;
    color: var(--sms-text-tertiary);
    display: flex;
    font-size: 10px;
    gap: 10px;
    justify-content: center;
    margin: 18px 0 12px;
  }
  .sms-inbox-day-separator::before,
  .sms-inbox-day-separator::after {
    background: var(--sms-border);
    content: "";
    flex: 1;
    height: 1px;
  }

  .sms-inbox-composer-wrap {
    background: var(--sms-panel);
    border-top: 1px solid var(--sms-border);
    padding: 12px 16px;
  }
  .sms-inbox-composer {
    align-items: flex-end;
    background: var(--sms-input);
    border: 1px solid var(--sms-border-strong);
    border-radius: 10px;
    display: flex;
    gap: 10px;
    padding: 8px 8px 8px 11px;
  }
  .sms-inbox-composer:focus-within { border-color: var(--sms-focus); }
  .sms-inbox-composer textarea {
    background: transparent;
    border: 0;
    color: var(--sms-text);
    line-height: 18px;
    max-height: 120px;
    min-height: 32px;
    outline: 0;
    padding: 6px 0;
    resize: none;
    width: 100%;
  }
  .sms-inbox-composer-footer {
    align-items: center;
    color: var(--sms-text-tertiary);
    display: flex;
    font-size: 10px;
    justify-content: space-between;
    margin-top: 6px;
    padding: 0 2px;
  }
  .sms-inbox-inline-error { color: var(--sms-danger); }

  .sms-inbox-empty {
    align-items: center;
    color: var(--sms-text-secondary);
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    min-height: 180px;
    padding: 28px;
    text-align: center;
  }
  .sms-inbox-empty strong { color: var(--sms-text); font-size: 14px; font-weight: 600; }
  .sms-inbox-empty span { font-size: 12px; line-height: 18px; margin-top: 5px; max-width: 280px; }

  .sms-inbox-details h2 {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin: 0 0 18px;
    text-transform: uppercase;
  }
  .sms-inbox-detail-avatar {
    align-items: center;
    background: var(--sms-avatar);
    border-radius: 50%;
    color: var(--sms-avatar-text);
    display: flex;
    font-size: 14px;
    font-weight: 700;
    height: 48px;
    justify-content: center;
    margin-bottom: 12px;
    width: 48px;
  }
  .sms-inbox-detail-name { font-size: 14px; font-weight: 600; line-height: 20px; }
  .sms-inbox-detail-phone { color: var(--sms-text-secondary); font-size: 12px; line-height: 18px; }
  .sms-inbox-detail-list { margin: 24px 0 0; }
  .sms-inbox-detail-row {
    border-top: 1px solid var(--sms-border);
    display: grid;
    gap: 10px;
    grid-template-columns: 68px minmax(0, 1fr);
    padding: 11px 0;
  }
  .sms-inbox-detail-row dt { color: var(--sms-text-tertiary); font-size: 11px; }
  .sms-inbox-detail-row dd { font-size: 11px; margin: 0; overflow-wrap: anywhere; text-align: right; }
  .sms-inbox-detail-status { color: var(--sms-success); font-weight: 600; text-transform: capitalize; }
  .sms-inbox-detail-status[data-status="SUPPRESSED"] { color: var(--sms-danger); }
  .sms-inbox-detail-status[data-status="CLOSED"] { color: var(--sms-text-secondary); }

  .sms-inbox-loading-row {
    animation: sms-inbox-pulse 1.2s ease-in-out infinite;
    background: var(--sms-hover);
    border-radius: 8px;
    height: 58px;
    margin: 6px;
  }
  @keyframes sms-inbox-pulse { 50% { opacity: 0.55; } }

  @media (prefers-reduced-motion: reduce) {
    .sms-inbox-loading-row { animation: none; }
  }

  @media (max-width: 1100px) {
    .sms-inbox-layout { grid-template-columns: 310px minmax(360px, 1fr); }
    .sms-inbox-details { display: none; }
  }

  @media (max-width: 720px) {
    .sms-inbox-root { min-height: 460px; }
    .sms-inbox-topbar { flex-basis: 52px; padding-left: 14px; }
    .sms-inbox-layout { display: block; position: relative; }
    .sms-inbox-sidebar,
    .sms-inbox-thread { height: 100%; width: 100%; }
    .sms-inbox-root[data-mobile-view="list"] .sms-inbox-thread { display: none; }
    .sms-inbox-root[data-mobile-view="thread"] .sms-inbox-sidebar { display: none; }
    .sms-inbox-secondary-button { display: inline-flex; }
    .sms-inbox-bubble-wrap { max-width: 86%; }
    .sms-inbox-messages { padding: 18px 14px; }
    .sms-inbox-composer-wrap { padding: 10px; }
  }
`;

type SmsInboxColors = CSSProperties & {
  '--sms-bg': string;
  '--sms-panel': string;
  '--sms-thread': string;
  '--sms-input': string;
  '--sms-hover': string;
  '--sms-selected': string;
  '--sms-border': string;
  '--sms-border-strong': string;
  '--sms-text': string;
  '--sms-text-secondary': string;
  '--sms-text-tertiary': string;
  '--sms-accent': string;
  '--sms-accent-hover': string;
  '--sms-focus': string;
  '--sms-disabled': string;
  '--sms-avatar': string;
  '--sms-avatar-text': string;
  '--sms-incoming': string;
  '--sms-outgoing': string;
  '--sms-success': string;
  '--sms-danger': string;
  '--sms-error-bg': string;
  '--sms-error-border': string;
  '--sms-error-text': string;
};

const LIGHT_COLORS: SmsInboxColors = {
  '--sms-bg': '#f7f7f8',
  '--sms-panel': '#ffffff',
  '--sms-thread': '#f4f5f7',
  '--sms-input': '#f8f8f9',
  '--sms-hover': '#f1f2f4',
  '--sms-selected': '#e9eefb',
  '--sms-border': '#e6e7ea',
  '--sms-border-strong': '#d6d8dd',
  '--sms-text': '#202124',
  '--sms-text-secondary': '#5f6368',
  '--sms-text-tertiary': '#777c84',
  '--sms-accent': '#315fd6',
  '--sms-accent-hover': '#264fb9',
  '--sms-focus': '#315fd6',
  '--sms-disabled': '#e2e4e8',
  '--sms-avatar': '#e4e9f5',
  '--sms-avatar-text': '#2f4f91',
  '--sms-incoming': '#ffffff',
  '--sms-outgoing': '#315fd6',
  '--sms-success': '#267a4d',
  '--sms-danger': '#bd2c3b',
  '--sms-error-bg': '#fff0f1',
  '--sms-error-border': '#f2c4c9',
  '--sms-error-text': '#8f1f2d',
};

const DARK_COLORS: SmsInboxColors = {
  '--sms-bg': '#171717',
  '--sms-panel': '#1d1d1d',
  '--sms-thread': '#181818',
  '--sms-input': '#242424',
  '--sms-hover': '#252525',
  '--sms-selected': '#26334f',
  '--sms-border': '#2b2b2b',
  '--sms-border-strong': '#3a3a3a',
  '--sms-text': '#f1f1f1',
  '--sms-text-secondary': '#b5b5b5',
  '--sms-text-tertiary': '#949494',
  '--sms-accent': '#3f6fdb',
  '--sms-accent-hover': '#4b7ce7',
  '--sms-focus': '#6e98f3',
  '--sms-disabled': '#303030',
  '--sms-avatar': '#30394b',
  '--sms-avatar-text': '#c9d9ff',
  '--sms-incoming': '#292929',
  '--sms-outgoing': '#315da8',
  '--sms-success': '#58b987',
  '--sms-danger': '#f07984',
  '--sms-error-bg': '#321f22',
  '--sms-error-border': '#613038',
  '--sms-error-text': '#ffb9c0',
};

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});
const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const LIST_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

const toDate = (value: string | null | undefined): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatConversationTime = (value: string | null): string => {
  const date = toDate(value);

  if (date === null) {
    return '';
  }

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return isToday ? TIME_FORMATTER.format(date) : LIST_DATE_FORMATTER.format(date);
};

const getInitials = (conversation: SmsConversation): string => {
  const name = getSmsConversationDisplayName(conversation);
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  const phoneDigits = name.replace(/\D/g, '');

  return phoneDigits.length > 0
    ? phoneDigits.slice(-2).padStart(2, '0')
    : name.slice(0, 2).toUpperCase();
};

const getMessageStatusLabel = (message: SmsMessage): string =>
  message.status.toLocaleLowerCase().replace(/^./, (letter) =>
    letter.toLocaleUpperCase(),
  );

const shouldShowDaySeparator = (
  message: SmsMessage,
  previousMessage: SmsMessage | undefined,
): boolean => {
  if (previousMessage === undefined) {
    return true;
  }

  const currentDate = toDate(message.occurredAt);
  const previousDate = toDate(previousMessage.occurredAt);

  return (
    currentDate === null ||
    previousDate === null ||
    currentDate.toDateString() !== previousDate.toDateString()
  );
};

type ConversationListProps = {
  conversations: SmsConversation[];
  selectedConversationId: string | null;
  searchTerm: string;
  isLoading: boolean;
  onSearchTermChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
};

const ConversationList = ({
  conversations,
  selectedConversationId,
  searchTerm,
  isLoading,
  onSearchTermChange,
  onSelectConversation,
}: ConversationListProps) => (
  <aside className="sms-inbox-sidebar" aria-label="SMS conversations">
    <div className="sms-inbox-search-wrap">
      <input
        className="sms-inbox-search"
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Search conversations"
        aria-label="Search SMS conversations"
      />
    </div>
    <div className="sms-inbox-list" role="listbox" aria-label="Conversations">
      {isLoading ? (
        <>
          <div className="sms-inbox-loading-row" />
          <div className="sms-inbox-loading-row" />
          <div className="sms-inbox-loading-row" />
        </>
      ) : conversations.length === 0 ? (
        <div className="sms-inbox-empty">
          <strong>{searchTerm === '' ? 'No conversations yet' : 'No matches'}</strong>
          <span>
            {searchTerm === ''
              ? 'Start a new message or wait for a customer to text your business.'
              : 'Try a contact name, company, phone number, or message.'}
          </span>
        </div>
      ) : (
        conversations.map((conversation) => (
          <button
            className="sms-inbox-conversation"
            key={conversation.id}
            type="button"
            role="option"
            aria-selected={conversation.id === selectedConversationId}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <span className="sms-inbox-avatar" aria-hidden="true">
              {getInitials(conversation)}
              <span
                className="sms-inbox-status-dot"
                data-status={conversation.status}
              />
            </span>
            <span className="sms-inbox-conversation-copy">
              <span className="sms-inbox-conversation-name">
                {getSmsConversationDisplayName(conversation)}
              </span>
              <span className="sms-inbox-conversation-preview">
                {getSmsConversationPreview(conversation)}
              </span>
            </span>
            <span className="sms-inbox-conversation-time">
              {formatConversationTime(conversation.lastMessageAt)}
            </span>
          </button>
        ))
      )}
    </div>
  </aside>
);

type MessageThreadProps = {
  conversation: SmsConversation | null;
  messages: SmsMessage[];
  isComposingNew: boolean;
  newPhoneNumber: string;
  messageDraft: string;
  isSending: boolean;
  composerError: string | null;
  onBack: () => void;
  onNewPhoneNumberChange: (value: string) => void;
  onMessageDraftChange: (value: string) => void;
  onSend: () => Promise<void>;
};

const MessageThread = ({
  conversation,
  messages,
  isComposingNew,
  newPhoneNumber,
  messageDraft,
  isSending,
  composerError,
  onBack,
  onNewPhoneNumberChange,
  onMessageDraftChange,
  onSend,
}: MessageThreadProps) => {
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messageList = messageListRef.current;

    if (messageList !== null) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [conversation?.id, messages.length]);

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      if (!isSending) {
        void onSend();
      }
    }
  };

  const canCompose = conversation !== null || isComposingNew;

  return (
    <main className="sms-inbox-thread" aria-label="Message thread">
      <header className="sms-inbox-thread-header">
        <button
          className="sms-inbox-secondary-button"
          type="button"
          onClick={onBack}
        >
          Conversations
        </button>
        <div className="sms-inbox-thread-header-copy">
          <div className="sms-inbox-thread-name">
            {isComposingNew
              ? 'New message'
              : conversation === null
                ? 'Select a conversation'
                : getSmsConversationDisplayName(conversation)}
          </div>
          {(conversation !== null || isComposingNew) && (
            <div className="sms-inbox-thread-phone">
              {isComposingNew ? 'Choose a recipient' : conversation?.phoneE164}
            </div>
          )}
        </div>
      </header>

      {isComposingNew && (
        <div className="sms-inbox-new-recipient">
          <label htmlFor="sms-inbox-phone">To</label>
          <input
            id="sms-inbox-phone"
            className="sms-inbox-phone-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={newPhoneNumber}
            onChange={(event) => onNewPhoneNumberChange(event.target.value)}
            placeholder="Customer phone number"
          />
        </div>
      )}

      <div className="sms-inbox-messages" ref={messageListRef} aria-live="polite">
        {conversation === null && !isComposingNew ? (
          <div className="sms-inbox-empty">
            <strong>Your messages live here</strong>
            <span>Select a conversation or start a new message.</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="sms-inbox-empty">
            <strong>{isComposingNew ? 'Start the conversation' : 'No messages yet'}</strong>
            <span>
              {isComposingNew
                ? 'Write the first message below. The customer can reply to the same thread.'
                : 'Send a message to begin this conversation.'}
            </span>
          </div>
        ) : (
          messages.map((message, index) => {
            const messageDate = toDate(message.occurredAt);
            const isFailed = message.status === 'FAILED';

            return (
              <div key={message.id}>
                {shouldShowDaySeparator(message, messages[index - 1]) && (
                  <div className="sms-inbox-day-separator">
                    {messageDate === null
                      ? 'Unknown date'
                      : DAY_FORMATTER.format(messageDate)}
                  </div>
                )}
                <div
                  className="sms-inbox-message-row"
                  data-direction={message.direction}
                >
                  <div className="sms-inbox-bubble-wrap">
                    <div className="sms-inbox-bubble">{message.body}</div>
                    <div
                      className="sms-inbox-message-meta"
                      data-failed={isFailed}
                    >
                      {messageDate === null ? '' : TIME_FORMATTER.format(messageDate)}
                      {message.direction === 'OUTBOUND'
                        ? ` · ${getMessageStatusLabel(message)}`
                        : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canCompose && (
        <div className="sms-inbox-composer-wrap">
          <div className="sms-inbox-composer">
            <textarea
              rows={1}
              value={messageDraft}
              onChange={(event) => onMessageDraftChange(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Write a message"
              aria-label="Message"
              disabled={isSending}
            />
            <button
              className="sms-inbox-send-button"
              type="button"
              disabled={isSending || messageDraft.trim() === ''}
              onClick={() => void onSend()}
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
          <div className="sms-inbox-composer-footer">
            <span className={composerError === null ? '' : 'sms-inbox-inline-error'}>
              {composerError ?? 'Enter to send · Shift + Enter for a new line'}
            </span>
            <span>{messageDraft.length} characters</span>
          </div>
        </div>
      )}
    </main>
  );
};

const ConversationDetails = ({
  conversation,
}: {
  conversation: SmsConversation | null;
}) => (
  <aside className="sms-inbox-details" aria-label="Conversation details">
    <h2>Details</h2>
    {conversation === null ? (
      <div className="sms-inbox-empty">
        <span>Select a conversation to see its CRM details.</span>
      </div>
    ) : (
      <>
        <div className="sms-inbox-detail-avatar" aria-hidden="true">
          {getInitials(conversation)}
        </div>
        <div className="sms-inbox-detail-name">
          {getSmsConversationDisplayName(conversation)}
        </div>
        <div className="sms-inbox-detail-phone">{conversation.phoneE164}</div>
        <dl className="sms-inbox-detail-list">
          <div className="sms-inbox-detail-row">
            <dt>Status</dt>
            <dd>
              <span
                className="sms-inbox-detail-status"
                data-status={conversation.status}
              >
                {conversation.status.toLocaleLowerCase()}
              </span>
            </dd>
          </div>
          <div className="sms-inbox-detail-row">
            <dt>Person</dt>
            <dd>
              {conversation.person === null
                ? 'Not linked'
                : [
                    conversation.person.firstName,
                    conversation.person.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ')}
            </dd>
          </div>
          <div className="sms-inbox-detail-row">
            <dt>Company</dt>
            <dd>{conversation.company?.name || 'Not linked'}</dd>
          </div>
          <div className="sms-inbox-detail-row">
            <dt>Last SMS</dt>
            <dd>{formatConversationTime(conversation.lastMessageAt) || '—'}</dd>
          </div>
        </dl>
      </>
    )}
  </aside>
);

export const SmsInbox = () => {
  const colorScheme = useColorScheme();
  const {
    conversations,
    messages,
    isLoading,
    isSending,
    errorMessage,
    refreshInbox,
    sendMessage,
  } = useSmsInbox();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isComposingNew, setIsComposingNew] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  const visibleConversations = useMemo(
    () => filterSmsConversations(conversations, searchTerm),
    [conversations, searchTerm],
  );
  const selectedConversation = isComposingNew
    ? null
    : (conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ??
      conversations[0] ??
      null);
  const selectedMessages = useMemo(
    () =>
      selectedConversation === null
        ? []
        : messages
            .filter(
              (message) =>
                message.conversationId === selectedConversation.id,
            )
            .sort(
              (firstMessage, secondMessage) =>
                Date.parse(firstMessage.occurredAt) -
                Date.parse(secondMessage.occurredAt),
            ),
    [messages, selectedConversation],
  );

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsComposingNew(false);
    setNewPhoneNumber('');
    setMessageDraft('');
    setComposerError(null);
    setMobileView('thread');
  };

  const handleStartNewMessage = () => {
    setIsComposingNew(true);
    setSelectedConversationId(null);
    setNewPhoneNumber('');
    setMessageDraft('');
    setComposerError(null);
    setMobileView('thread');
  };

  const handleSend = async () => {
    const toNumber = isComposingNew
      ? newPhoneNumber.trim()
      : (selectedConversation?.phoneE164 ?? '');
    const text = messageDraft.trim();

    if (toNumber === '') {
      setComposerError('Enter the customer phone number.');
      return;
    }

    if (text === '') {
      setComposerError('Write a message before sending.');
      return;
    }

    setComposerError(null);
    const wasSent = await sendMessage({ toNumber, text });

    if (wasSent) {
      setMessageDraft('');
      setIsComposingNew(false);
      setNewPhoneNumber('');
    }
  };

  const activeConversationId = selectedConversation?.id ?? null;

  return (
    <div
      className="sms-inbox-root"
      data-mobile-view={mobileView}
      style={colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS}
    >
      <style>{SMS_INBOX_STYLES}</style>
      <header className="sms-inbox-topbar">
        <div className="sms-inbox-heading">
          <h1>SMS inbox</h1>
          <p>
            {conversations.length === 1
              ? '1 conversation'
              : `${conversations.length} conversations`}
          </p>
        </div>
        <button
          className="sms-inbox-primary-button"
          type="button"
          onClick={handleStartNewMessage}
        >
          New message
        </button>
      </header>

      {errorMessage !== null && (
        <div className="sms-inbox-error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void refreshInbox(true)}>
            Try again
          </button>
        </div>
      )}

      <div className="sms-inbox-layout">
        <ConversationList
          conversations={visibleConversations}
          selectedConversationId={activeConversationId}
          searchTerm={searchTerm}
          isLoading={isLoading}
          onSearchTermChange={setSearchTerm}
          onSelectConversation={handleSelectConversation}
        />
        <MessageThread
          conversation={selectedConversation}
          messages={selectedMessages}
          isComposingNew={isComposingNew}
          newPhoneNumber={newPhoneNumber}
          messageDraft={messageDraft}
          isSending={isSending}
          composerError={composerError}
          onBack={() => setMobileView('list')}
          onNewPhoneNumberChange={(value) => {
            setNewPhoneNumber(value);
            setComposerError(null);
          }}
          onMessageDraftChange={(value) => {
            setMessageDraft(value);
            setComposerError(null);
          }}
          onSend={handleSend}
        />
        <ConversationDetails conversation={selectedConversation} />
      </div>
    </div>
  );
};
