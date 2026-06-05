import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { description, location, gas_mix } = await req.json();

    const prompt = `Based on the following dive information, suggest 5-8 relevant tags/keywords:
Description: ${description || 'N/A'}
Location: ${location || 'N/A'}
Gas Mix: ${gas_mix || 'N/A'}

Return a JSON object with: { tags: ["tag1", "tag2", ...] }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Suggested tags for the dive'
          }
        },
        required: ['tags']
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});