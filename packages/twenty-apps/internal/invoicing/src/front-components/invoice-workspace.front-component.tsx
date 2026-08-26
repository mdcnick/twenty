import { defineFrontComponent } from 'twenty-sdk/define';

import { INVOICE_WORKSPACE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { InvoiceWorkspace } from 'src/front-components/components/InvoiceWorkspace';

export default defineFrontComponent({
  universalIdentifier: INVOICE_WORKSPACE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'invoice-workspace',
  description:
    'Status-aware invoice queue with a document preview, payments, and source details.',
  component: InvoiceWorkspace,
});
