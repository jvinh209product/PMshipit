export const deskActivities=[
  {id:'prd',title:'Write the PRD',hours:2,description:'Make the user problem, smallest useful scope, and open questions explicit.',effects:{strategy:5,delivery:4}},
  {id:'backlog',title:'Review the backlog',hours:.75,description:'Separate evidence-backed priorities from requests that still need context.',effects:{strategy:3,delivery:2}},
  {id:'notes',title:'Analyze research notes',hours:.5,description:'Look for patterns, contradictions, and the assumptions worth testing next.',effects:{customer:3,strategy:2}},
  {id:'prepare',title:'Prepare the next meeting',hours:.5,description:'One outcome. A clear decision owner. Evidence the room can share.',effects:{strategy:2,team:2}},
  {id:'messages',title:'Check team messages',hours:.25,description:'Respond to the people waiting on a decision, then protect your focus.',effects:{team:1,delivery:1}}
];
export const informalTopics={
  Design:{quote:'“The onboarding still feels heavier than it should. People can finish setup without finding the useful part.”',signal:'Onboarding friction',flag:'onboardingSignal',effects:{customer:3,quality:2}},
  Engineering:{quote:'“That API dependency is making me nervous. We should have a fallback before it becomes a release blocker.”',signal:'Dependency warning',flag:'dependencySignal',effects:{strategy:3,quality:2}},
  Research:{quote:'“The strongest interviews are from teams handling daily operations. Their work is a little different from the buyers’ requests.”',signal:'Operations-team insight',flag:'segmentSignal',effects:{customer:4,strategy:2}},
  Support:{quote:'“I’m hearing the same workspace setup question over and over. The dashboard hasn’t caught up with it yet.”',signal:'Onboarding confusion',flag:'supportSignal',effects:{customer:4,quality:2}},
  Sales:{quote:'“Enterprise keeps asking about SSO. I need a timeline I can explain without making the roadmap for us.”',signal:'Enterprise expectation',flag:'ssoSignal',effects:{business:3,strategy:2}},
  Marketing:{quote:'“The campaign can bring teams in. We still need to give them a reason to come back next week.”',signal:'Retention before acquisition',flag:'retentionSignal',effects:{customer:3,business:2}},
  QA:{quote:'“The rare bugs are the ones I worry about. Losing a customer’s work does not become harmless because it happens less often.”',signal:'Draft-loss risk',flag:'draftSignal',effects:{quality:4,customer:2}},
  CEO:{quote:'“I need a story we can stand behind. If we cut something, help me explain what we gain instead.”',signal:'Executive context',flag:'ceoSignal',effects:{strategy:3,business:2}}
};
