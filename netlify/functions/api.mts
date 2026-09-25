import type { Handler } from '@netlify/functions';
import serverless from 'serverless-http';
import { getExpressApp } from '../../dist/serverless.js';

export const handler: Handler = async (event, context) => {
  const expressApp = await getExpressApp();
  const proxy = serverless(expressApp);
  // serverless-http's default AWS provider reads event.requestContext.identity.sourceIp
  // and event.requestContext.requestId, neither of which Netlify's classic function event
  // includes. Shim them from the Netlify context so the request doesn't throw.
  const eventWithRequestContext = {
    ...event,
    requestContext: { identity: { sourceIp: context.ip ?? '' }, requestId: context.requestId },
  };
  return proxy(eventWithRequestContext, context) as ReturnType<Handler>;
};
