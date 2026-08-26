import { CoreApiClient } from 'twenty-client-sdk/core';

export type CallRequest = { id: string; requestKey: string; status: 'PENDING' | 'ACCEPTED' | 'PERSISTENCE_UNCERTAIN' | 'FAILED'; providerCallId?: string };
export type CallRequestRepository = {
  findByRequestKey(requestKey: string): Promise<CallRequest | null>;
  createPending(input: { requestKey: string; fromNumber: string; toNumber: string }): Promise<CallRequest>;
  markProviderAccepted(id: string, providerCallId: string): Promise<void>;
  markPersistenceUncertain(id: string, providerCallId?: string): Promise<void>;
  markProviderAcceptedByRequestKey(requestKey: string, providerCallId: string): Promise<boolean>;
};
type CoreClient = { query(request: Record<string, unknown>): Promise<unknown>; mutation(request: Record<string, unknown>): Promise<unknown> };
const requestNode = (value: unknown): CallRequest | null => (value as { callRequests?: { edges?: Array<{ node?: CallRequest }> } })?.callRequests?.edges?.[0]?.node ?? null;

export const createTwentyCallRequestRepository = (client: CoreClient = new CoreApiClient() as unknown as CoreClient): CallRequestRepository => ({
  async findByRequestKey(requestKey) {
    return requestNode(await client.query({ callRequests: { __args: { filter: { requestKey: { eq: requestKey } }, first: 1 }, edges: { node: { id: true, requestKey: true, status: true, providerCallId: true } } } }));
  },
  async createPending(input) {
    const result = await client.mutation({ createCallRequest: { __args: { data: { requestKey: input.requestKey, status: 'PENDING', fromNumber: { primaryPhoneNumber: input.fromNumber }, toNumber: { primaryPhoneNumber: input.toNumber } } }, id: true, requestKey: true, status: true } });
    const request = (result as { createCallRequest?: CallRequest }).createCallRequest;
    if (!request) throw new Error('createCallRequest did not return a durable call request');
    return request;
  },
  async markProviderAccepted(id, providerCallId) {
    await client.mutation({ updateCallRequest: { __args: { id, data: { status: 'ACCEPTED', providerCallId, acceptedAt: new Date().toISOString() } }, id: true } });
  },
  async markPersistenceUncertain(id, providerCallId) {
    await client.mutation({ updateCallRequest: { __args: { id, data: { status: 'PERSISTENCE_UNCERTAIN', ...(providerCallId ? { providerCallId } : {}) } }, id: true } });
  },
  async markProviderAcceptedByRequestKey(requestKey, providerCallId) {
    const request = await this.findByRequestKey(requestKey);
    if (!request) return false;
    await this.markProviderAccepted(request.id, providerCallId);
    return true;
  },
});
