import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const dives = await base44.entities.Dive.list('-date', 100);
    
    if (dives.length === 0) {
      return Response.json({ insights: [] });
    }

    const totalDives = dives.length;
    const avgDepth = (dives.reduce((s, d) => s + (d.max_depth || 0), 0) / totalDives).toFixed(1);
    const avgBottomTime = (dives.reduce((s, d) => s + (d.bottom_time || 0), 0) / totalDives).toFixed(0);
    const maxDepth = Math.max(...dives.map(d => d.max_depth || 0));
    const locations = [...new Set(dives.map(d => d.location).filter(Boolean))];
    const gasMixes = [...new Set(dives.map(d => d.gas_mix).filter(Boolean))];
    const avgRating = dives.filter(d => d.rating).length > 0 
      ? (dives.filter(d => d.rating).reduce((s, d) => s + d.rating, 0) / dives.filter(d => d.rating).length).toFixed(1)
      : 'N/A';

    const stats = `
Total Dives: ${totalDives}
Average Depth: ${avgDepth}m
Maximum Depth: ${maxDepth}m
Average Bottom Time: ${avgBottomTime} minutes
Average Rating: ${avgRating}/5
Favorite Locations: ${locations.slice(0, 5).join(', ')}
Common Gas Mixes: ${gasMixes.join(', ')}
    `;

    const prompt = `Analyze the following diver's statistics and provide 3-4 insights about their diving patterns, progress, and areas for improvement:

${stats}

Return a JSON object with: { insights: ["insight1", "insight2", ...] }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: { type: 'string' },
            description: 'Insights about dive patterns and trends'
          }
        },
        required: ['insights']
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});