import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OCPlanner from '../components/planner/OCPlanner';
import CCRPlanner from '../components/planner/CCRPlanner';
import MultiLevelPlanner from '../components/planner/MultiLevelPlanner';
import WeatherConditions from '../components/planner/WeatherConditions';
import DiveChecklist from '../components/planner/DiveChecklist';
import SavedPlans from '../components/planner/SavedPlans';

export default function DivePlanner() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ background: '#0a0a0acc', borderBottom: '1px solid #1e1e1e', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Dive Planner</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Prototype Warning */}
        <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: '#7c2d1222', border: '1px solid #dc262688' }}>
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-red-400 font-semibold text-sm">Prototype — Do Not Use for Real Dive Planning</p>
            <p className="text-red-300/70 text-xs mt-0.5">This planner is for illustration purposes only, showing the type of functionality this page could offer. All calculations are approximations. Always use certified dive planning software and a qualified instructor for actual dives. Any functionality on this page must be approved before use.</p>
          </div>
        </div>

        <Tabs defaultValue="oc">
          <TabsList className="w-full mb-6 grid grid-cols-6 h-auto" style={{ background: '#141414', border: '1px solid #222' }}>
            <TabsTrigger value="oc" className="data-[state=active]:text-white text-xs"
              style={{ '--tw-ring-color': 'transparent' }}>
              OC
            </TabsTrigger>
            <TabsTrigger value="ccr" className="data-[state=active]:text-white text-xs">
              CC
            </TabsTrigger>
            <TabsTrigger value="multi" className="data-[state=active]:text-white text-xs">
              Multi
            </TabsTrigger>
            <TabsTrigger value="conditions" className="data-[state=active]:text-white text-xs">
              Weather
            </TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:text-white text-xs">
              Checklist
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:text-white text-xs">
              Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oc">
            <OCPlanner />
          </TabsContent>

          <TabsContent value="ccr">
            <CCRPlanner />
          </TabsContent>

          <TabsContent value="multi">
            <MultiLevelPlanner />
          </TabsContent>

          <TabsContent value="conditions">
            <WeatherConditions />
          </TabsContent>

          <TabsContent value="checklist">
            <DiveChecklist />
          </TabsContent>

          <TabsContent value="saved">
            <SavedPlans />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}