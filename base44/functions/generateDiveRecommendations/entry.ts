import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const dives = await base44.entities.Dive.list('-date', 50);
    
    if (dives.length === 0) {
      return Response.json({
        recommendations: ['Log some dives first to get personalized recommendations']
      });
    }

    const diveHistory = dives.slice(0, 20).map(d => ({
      location: d.location,
      depth: d.max_depth,
      gas_mix: d.gas_mix,
      rating: d.rating
    })).join('\n');

    const prompt = `Based on this diver's recent dive history and patterns, provide 3-4 personalized dive recommendations:

Recent Dives:
${diveHistory}

Return a JSON object with: { recommendations: ["recommendation1", "recommendation2", ...] }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Personalized dive recommendations'
          }
        },
        required: ['recommendations']
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});