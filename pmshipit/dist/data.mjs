export const dimensions = [
  ['customer','Customer','User understanding'],['business','Business','Business impact'],
  ['delivery','Delivery','Execution'],['quality','Quality','Product quality'],
  ['team','Team','Team trust'],['strategy','Strategy','Strategic clarity'],['energy','Energy','Personal capacity']
];
export const chapters = [
  {name:'Discover',range:'01–05',start:1,end:5,question:'What problem are we actually solving?',objective:'Find the problem worth solving.'},
  {name:'Define',range:'06–10',start:6,end:10,question:'What should we build, and what should we refuse?',objective:'Make room for what matters.'},
  {name:'Build',range:'11–20',start:11,end:20,question:'How do we deliver without burning out the team?',objective:'Turn your direction into a release.'},
  {name:'Launch',range:'21–27',start:21,end:27,question:'Is the product ready enough to launch?',objective:'Choose your risks. Own the launch.'},
  {name:'Learn',range:'28–30',start:28,end:30,question:'What happens when users meet your decisions?',objective:'Listen to what the launch is telling you.'}
];
export const people = {
  CEO:{name:'Alex',role:'Founder & CEO',initial:'A',color:'#cc7952',concern:'Momentum, a clear story, and a business that survives.'},
  Engineering:{name:'Dan',role:'Engineering lead',initial:'D',color:'#708985',concern:'Reliable systems and a scope the team can actually deliver.'},
  Design:{name:'Maya',role:'Product designer',initial:'M',color:'#9c90b7',concern:'A product that makes sense to the people using it.'},
  Research:{name:'Jules',role:'User researcher',initial:'J',color:'#bb9b5e',concern:'Evidence that changes a decision, rather than decorates it.'},
  QA:{name:'Sam',role:'QA lead',initial:'S',color:'#7494a8',concern:'Trust, recoverability, and the edge cases everyone misses.'},
  Sales:{name:'Leo',role:'Sales lead',initial:'L',color:'#b67b88',concern:'Keeping customer commitments without losing the next deal.'},
  Marketing:{name:'Noor',role:'Marketing lead',initial:'N',color:'#769465',concern:'A credible launch story and measurable growth.'},
  Support:{name:'Riley',role:'Customer support lead',initial:'R',color:'#cc9661',concern:'Real customer problems and a team equipped to help.'}
};
// Options disclose trade-offs, while their exact effects remain in the simulation.
const o=(label,tradeoff,hours,effects={},flags={},relations={},delay=null)=>({label,tradeoff,hours,effects,flags,relations,delay});
const s=(id,day,title,room,person,context,evidence,insight,options,type='decision')=>({id,day,title,room,person,context,evidence,insight,options,type});
export const scenarios = [
  s('ai',1,'The CEO wants AI','ceo','CEO','“Our competitor just launched AI. We need AI too. Can you put it on the roadmap?” You have a deadline, but no agreed customer problem.',[['Launch deadline','30 days'],['Customer evidence','Very little'],['Request','AI, apparently']], 'Technology is a solution. First agree on the problem.',[
    o('Put AI on the roadmap','Executive momentum; more scope before evidence.',.5,{delivery:5,business:3,strategy:-7,customer:-4},{ai:true},{CEO:8},{day:10,text:'The AI promise returns: the team still cannot agree which problem it solves.',effects:{strategy:-6,team:-3}}),
    o('Ask which customer problem it solves','A clearer direction; a slower first conversation.',1,{strategy:9,customer:6,delivery:-2},{problem:'Busy teams lose decisions across tools.'},{CEO:2,Research:4}),
    o('Map the competitive landscape','Market context; less time with your own customers.',1.5,{business:7,strategy:4},{competitor:true},{CEO:4}),
    o('Park it until discovery is done','Protect focus; explain the pause to the founder.',.25,{strategy:4,energy:2},{ai:false},{CEO:-5})
  ]),
  s('research',2,'Research or prototype?','research','Research','Jules wants five customer interviews. Dan can have a prototype ready this afternoon. You cannot fund both fully today.',[['Interviews','5 requested'],['Prototype','1 afternoon'],['Known pain','Scattered team decisions']], 'Choose the evidence that will change your next decision.',[
    o('Run five customer interviews','Rich context; a slower build start.',3,{customer:14,strategy:7,delivery:-4},{research:true},{Research:7},{day:12,text:'Your research notes help Maya resolve the onboarding debate.',effects:{quality:6,team:3}}),
    o('Build a prototype today','Fast feedback; you may be testing the wrong premise.',2,{delivery:9,customer:3},{prototype:true},{Engineering:5},{day:12,text:'Prototype users like the polish, but struggle to explain its purpose.',effects:{strategy:-4}}),
    o('Three interviews, one rough prototype','Triangulate the signal; spend more time and energy.',4,{customer:11,strategy:7,delivery:4,energy:-5},{research:true,prototype:true},{Research:4,Engineering:4}),
    o('Use the existing sales notes','Preserve time; your evidence reflects buyers, not all users.',1,{business:5,customer:2,strategy:-3},{research:false},{Sales:5},{day:12,text:'The design team has buyer requests, but little evidence of daily user needs.',effects:{quality:-5,team:-3}})
  ]),
  s('loud',3,'The loudest customer','sales','Sales','“Our biggest customer says advanced filters are critical.” Analytics suggests only 4% of users encounter this problem. That customer represents a quarter of revenue.',[['Users affected','4%'],['Revenue exposure','25%'],['Build estimate','8 points']], 'Small reach does not necessarily mean small business value.',[
    o('Commit to the feature','Protect a deal; concentrate the roadmap.',1,{business:8,customer:-3,strategy:-4},{vip:true},{Sales:8},{day:16,text:'The VIP filter has grown into three special cases.',effects:{delivery:-5,quality:-3}}),
    o('Investigate the customer workflow','Better context; no immediate promise.',1.5,{customer:8,business:4,strategy:5},{vipResearch:true},{Sales:2,Research:4}),
    o('Offer a supported workaround','Keep focus; accept manual operations.',.5,{business:4,delivery:3,quality:-1},{workaround:true},{Sales:3,Support:-2}),
    o('Decline and explain the focus','A cleaner roadmap; a real commercial risk.',.5,{strategy:7,business:-5},{vip:false},{Sales:-7})
  ]),
  s('segments',4,'Simple. But with more control.','research','Research','Three new users ask for a simpler setup. Two power users want fine-grained controls. Both groups are describing legitimate needs.',[['New users','Need less setup'],['Power users','Need more control'],['Sample size','5 interviews']], 'Different segments can legitimately need different experiences.',[
    o('Optimize for new teams','Faster activation; advanced workflows wait.',1,{customer:7,quality:5,business:-1},{segment:'New teams',onboarding:true},{Design:4}),
    o('Optimize for power users','Deeper engagement; first-time friction remains.',1,{business:7,customer:4,quality:-2},{segment:'Power users'},{Sales:4}),
    o('Use progressive disclosure','Serve both; introduce implementation complexity.',2,{customer:9,quality:7,delivery:-3},{segment:'Growing teams',onboarding:true},{Design:6,Engineering:-2}),
    o('Interview another five users','Reduce uncertainty; spend time before deciding.',2.5,{customer:11,strategy:4,delivery:-4},{segment:'Growing teams',research:true},{Research:6})
  ]),
  s('usage',5,'82% usage. Is that value?','analytics','Research','The feature dashboard shows 82% adoption. A closer look reveals that every user must pass through it to reach their project.',[['Feature usage','82%'],['Mandatory step','Yes'],['Satisfaction','Unknown']], 'Usage is not always value.',[
    o('Celebrate the adoption number','A clean story; a misleading signal.',.5,{business:4,customer:-6,strategy:-5},{vanity:true},{CEO:4},{day:29,text:'The mandatory step still shows high usage as retention drops.',effects:{strategy:-5}}),
    o('Inspect behavior and completion','More useful evidence; more analysis time.',1.5,{customer:9,strategy:8},{evidence:true},{Research:4}),
    o('Remove the forced step','Less friction; limited validation.',1,{quality:5,delivery:-2},{onboarding:true},{Design:4}),
    o('Track successful team outcomes','A better definition; instrumentation work.',1,{strategy:9,customer:4,delivery:-1},{metric:'Weekly active teams'},{Engineering:2})
  ]),
  s('scope',6,'93 points. 42 points of capacity.','product','Engineering','The requested roadmap has 93 points. Your team has 42. Build a scope you can defend. Inspect the cards, then move them into MVP, Later, or Kill.',[['Requested scope','93 pts'],['Team capacity','42 pts'],['Launch','Day 27']], 'Prioritization is deciding what not to build.',[],'board'),
  s('override',7,'“Make this a must-have.”','ceo','CEO','Alex marks AI Search as a launch requirement. The evidence is still weak. Your prioritization board now has an executive-shaped hole in it.',[['Evidence','Low'],['AI Search cost','21 points'],['Alternative','A small experiment']], 'Authority changes the conversation, not the capacity.',[
    o('Accept the override','Keep executive alignment; absorb the cost.',.5,{business:5,strategy:-6,delivery:-6,team:-4},{ai:true},{CEO:8,Engineering:-5}),
    o('Challenge it with customer evidence','Protect the strategy; risk an uncomfortable conversation.',1,{strategy:9,customer:4,team:3},{ai:false},{CEO:-3,Engineering:5}),
    o('Negotiate a small experiment','Learn quickly; a smaller executive promise.',1.5,{strategy:7,business:4,delivery:2},{aiExperiment:true},{CEO:3,Engineering:3}),
    o('Trade another feature out','Respect capacity; give up other value.',1,{delivery:5,business:3,customer:-3},{ai:true},{CEO:5,Design:-2})
  ]),
  s('sso',8,'Sales already promised SSO','sales','Sales','A customer was promised SSO before launch. Dan estimates eight working days. There is no room in the current plan.',[['Customer commitment','Before launch'],['Estimate','8 days'],['Capacity','Already allocated']], 'A broken internal promise needs an external conversation.',[
    o('Add SSO to the release','Preserve the promise; overload the team.',1,{business:8,delivery:-9,quality:-4,team:-5},{sso:true},{Sales:7,Engineering:-6}),
    o('Renegotiate the customer timeline','Protect delivery; own the difficult call.',1.5,{delivery:7,team:5,business:-3},{sso:false},{Sales:-2,Engineering:6}),
    o('Offer a temporary manual workflow','Keep the customer moving; add support overhead.',1,{business:4,delivery:3,quality:-2},{ssoManual:true},{Sales:4,Support:-3}),
    o('Move the launch date','Keep the promise in scope; lose momentum.',.5,{quality:6,delivery:4,business:-7},{launchSlip:2,sso:true},{CEO:-5,Engineering:4})
  ]),
  s('kpi',9,'Pick the signal, not the story','analytics','CEO','What will tell you this product is working? Choose the primary metric for Orbit, a shared workspace that helps busy teams turn conversations into decisions.',[['Product','Orbit'],['Target','Small operational teams'],['Promise','Less lost work']], 'A primary metric should reflect the value your product delivers.',[
    o('New signups','Measure reach; does not show sustained value.',.75,{business:5,strategy:-2},{metric:'New signups',vanity:true},{Marketing:4}),
    o('Activated teams','Measure first value; longer-term use remains uncertain.',1,{customer:5,strategy:7},{metric:'Activated teams'},{Design:3}),
    o('Weekly active teams','Measure recurring value; a slower feedback cycle.',1,{customer:7,strategy:8},{metric:'Weekly active teams'},{Research:4}),
    o('Revenue per team','Measure the business; early learning may become secondary.',1,{business:9,strategy:4},{metric:'Revenue per team'},{CEO:5,Sales:3})
  ]),
  s('mvp',10,'Minimum viable. Maximum debate.','design','Design','Maya says onboarding is confusing. Dan says every extra screen threatens the date. The product works, but new teams cannot find their first useful action.',[['First task completion','41%'],['UX estimate','3 days'],['Launch hypothesis','A simpler team workflow']], 'A viable product must deliver value, not just execute code.',[
    o('Include the full onboarding redesign','Better first use; a delivery cost.',2,{quality:9,customer:6,delivery:-6},{onboarding:true},{Design:7,Engineering:-3}),
    o('Defer onboarding entirely','Protect the date; accept first-use friction.',.5,{delivery:7,quality:-6,customer:-3},{onboarding:false},{Engineering:3,Design:-5},{day:29,text:'Support reports that new teams cannot understand setup.',effects:{customer:-6,business:-3}}),
    o('Reduce it to one guided first task','Target the friction; leave visual polish for later.',1.5,{quality:7,customer:7,delivery:2},{onboarding:true},{Design:4,Engineering:3}),
    o('Run a rapid usability test','Find the smallest useful fix; spend time learning.',2,{customer:10,quality:5,delivery:-2},{onboarding:true,usability:true},{Design:6,Research:4})
  ]),
  s('payment',11,'A small failure. A big trust problem.','engineering','Engineering','Payment fails for 3% of beta users. The fix is estimated at two days. The affected flow is central to the commercial launch.',[['Payment failures','3%'],['Fix estimate','2 days'],['Impact','Lost transactions']], 'Risk is probability multiplied by consequence, not probability alone.',[
    o('Fix it before adding features','Protect customer trust; give up delivery time.',2,{quality:12,delivery:-5,business:3},{paymentFixed:true,bugs:-1},{Engineering:5,QA:7}),
    o('Ship with monitoring','Move fast; monitoring cannot repair a lost transaction.',.5,{delivery:7,quality:-8},{paymentFixed:false},{CEO:3,QA:-5},{day:28,text:'The beta payment issue reappears under launch traffic.',effects:{quality:-9,business:-5}}),
    o('Disable the affected payment path','Contain impact; reduce commercial reach.',1,{quality:6,business:-4,delivery:3},{paymentDisabled:true},{QA:3,Sales:-3}),
    o('Reserve two days of launch buffer','Keep the fix; make the schedule cost visible.',1,{quality:10,business:-4,team:4},{paymentFixed:true,launchSlip:2,bugs:-1},{Engineering:6,CEO:-4})
  ]),
  s('usability',12,'It works. People cannot use it.','design','Design','Beta users get through setup but cannot find their team workspace. Maya wants three days to improve the flow.',[['Setup completion','71%'],['First useful action','42%'],['UX estimate','3 days']], 'Technical completion and customer success are different things.',[
    o('Improve the full experience','Higher usability; lower feature throughput.',2,{quality:10,customer:8,delivery:-5},{onboarding:true},{Design:7}),
    o('Keep the launch date and current flow','Preserve speed; support absorbs confusion.',.5,{delivery:7,customer:-5,quality:-4},{onboarding:false},{Design:-4,Support:-3}),
    o('Ship one clear first-use path','Reduce friction; narrow the experience.',1.5,{quality:6,customer:7,delivery:3},{onboarding:true},{Design:4,Engineering:4}),
    o('Test with five teams today','Target the fix; a day of evidence gathering.',2.5,{customer:11,quality:5,delivery:-2},{usability:true,onboarding:true},{Research:5,Design:4})
  ]),
  s('debt',13,'The shortcut has a receipt','engineering','Engineering','Dan can ship the module quickly, but it will need a rewrite. A stable implementation costs more now. The deadline has not moved.',[['Shortcut','1 day'],['Stable module','3 days'],['Future maintenance','Uncertain']], 'A shortcut is a loan. Know what you borrowed and when it comes due.',[
    o('Take the quick implementation','Faster delivery; compound maintenance risk.',1,{delivery:10,quality:-7},{debt:18},{Engineering:-3},{day:26,text:'The shortcut module now makes a release fix take twice as long.',effects:{delivery:-6,quality:-3}}),
    o('Invest in the stable architecture','Less future risk; a slower release.',2.5,{quality:12,delivery:-7,team:4},{debt:-8},{Engineering:7}),
    o('Isolate the shortcut behind an interface','Contain debt; accept some extra work today.',1.5,{quality:5,delivery:4},{debt:5},{Engineering:4}),
    o('Cut the dependent feature','Protect the system; reduce launch value.',.75,{quality:6,delivery:5,business:-5},{debt:-3},{Engineering:4,Sales:-3})
  ]),
  s('vendor',14,'Your dependency is four days late','engineering','Engineering','The integration vendor slips their delivery. Your roadmap assumed their API would be ready. Nobody owns the contingency.',[['Vendor delay','4 days'],['Dependency','Activity integration'],['Backup','Not agreed']], 'Dependencies are product risks, not just engineering risks.',[
    o('Wait for the vendor','Keep the design; accept schedule uncertainty.',.5,{delivery:-8,quality:3},{vendorWait:true},{Engineering:-2}),
    o('Build a mock behind a feature flag','Unblock work; test the real integration later.',1.5,{delivery:7,quality:-2},{featureFlag:true},{Engineering:5}),
    o('Switch vendors now','Potentially recover; add new unknowns.',2,{business:-4,delivery:2,quality:-3},{vendorSwitch:true},{Engineering:-2}),
    o('Remove the integration from MVP','A predictable release; less initial value.',.75,{delivery:8,quality:5,business:-4,customer:-2},{integrationCut:true},{Engineering:5,Sales:-2})
  ]),
  s('referrals',15,'“Just one referral field.”','sales','Marketing','The referral campaign is designed. Noor asks for referral codes before launch. It looks like a small field. Dan sees attribution, abuse prevention, and billing rules.',[['Campaign','Already designed'],['UI cost','Small'],['System cost','Not estimated']], 'Small on the screen does not mean small in the system.',[
    o('Add referral codes','Growth potential; unplanned complexity.',1,{business:7,delivery:-5,quality:-3},{referrals:true},{Marketing:6,Engineering:-4}),
    o('Trade an existing feature out','Respect capacity; change the product promise.',1.5,{business:4,delivery:3,customer:-2},{referrals:true},{Marketing:4,Design:-2}),
    o('Schedule a post-launch experiment','Protect delivery; accept a smaller campaign.',.75,{delivery:6,strategy:5,business:-2},{referrals:false},{Engineering:3,Marketing:-2}),
    o('Run a manual referral pilot','Learn cheaply; add operational overhead.',1,{business:5,customer:3},{manualReferral:true},{Marketing:3,Support:-3})
  ]),
  s('estimate',16,'Two days became five','engineering','Engineering','The estimate doubled after implementation exposed edge cases. Dan brings the new information before the sprint is over.',[['Original estimate','2 days'],['New estimate','5 days'],['Cause','Unexpected edge cases']], 'Estimates are information, not promises.',[
    o('Push the team to keep the estimate','Preserve the story; erode trust and quality.',.5,{delivery:4,team:-9,quality:-5},{overtime:true},{Engineering:-8}),
    o('Cut scope to the essential workflow','Fit the capacity; reduce the initial promise.',1.5,{delivery:8,strategy:6,team:4,customer:-1},{split:true},{Engineering:6}),
    o('Move the delivery commitment','Be transparent; lose near-term momentum.',1,{quality:7,team:6,business:-5},{launchSlip:1},{Engineering:6,CEO:-3}),
    o('Split the release behind a flag','Learn in stages; manage two release paths.',1.5,{delivery:6,quality:4,strategy:4},{featureFlag:true,split:true},{Engineering:4})
  ]),
  s('draft',17,'Only 0.6%. But their work is gone.','war','QA','A rare edge case deletes an unsaved draft. Sam can reproduce it on an older device. A full fix takes a day.',[['Affected sessions','0.6%'],['Impact','Lost customer work'],['Fix','1 day']], 'The severity of the harm matters more than the size of the segment.',[
    o('Block release until fixed','Protect trust; spend your remaining buffer.',2,{quality:11,customer:5,delivery:-4},{draftFixed:true,bugs:-1},{QA:7}),
    o('Document it as a known issue','Preserve the date; accept avoidable loss.',.5,{delivery:5,quality:-8,customer:-4},{draftFixed:false},{QA:-5}),
    o('Add local autosave as a workaround','Reduce harm quickly; keep a tracked defect.',1.5,{quality:7,customer:5,delivery:1},{draftFixed:true},{QA:4,Engineering:3}),
    o('Ship with monitoring','Keep momentum; a dashboard cannot recover the draft.',.5,{delivery:6,quality:-7},{draftFixed:false},{QA:-4},{day:29,text:'A customer loses a project draft. Support cannot restore it.',effects:{customer:-6,quality:-4}})
  ]),
  s('conflict',18,'The handoff became a standoff','meeting','Design','Maya says Engineering keeps cutting interaction quality. Dan says requirements keep changing. Both are describing a real process problem.',[['Design concern','Quality is cut'],['Engineering concern','Scope keeps moving'],['Team mood','Defensive']], 'Alignment is shared understanding, not agreement at any cost.',[
    o('Speak with each lead privately','Understand the conflict; convergence takes longer.',2,{team:8,customer:3,delivery:-2},{alignment:true},{Design:5,Engineering:5}),
    o('Moderate a joint alignment meeting','Make the trade-offs explicit; spend group time.',1.5,{team:9,strategy:5},{alignment:true},{Design:4,Engineering:4}),
    o('Make the decision yourself','Fast resolution; ownership may weaken.',.5,{delivery:6,team:-5,quality:-2},{alignment:false},{Design:-3,Engineering:-3}),
    o('Ask the leads to sort it out','Protect your calendar; ambiguity persists.',.25,{energy:3,team:-6,delivery:-3},{alignment:false},{Design:-3,Engineering:-3})
  ],'meeting'),
  s('burnout',19,'The team is still online at midnight','coffee','Engineering','Dan mentions that three engineers worked late all week. QA is starting to find rushed mistakes. They do not ask for a deadline change.',[['Overtime','5 nights'],['Mistakes','Trending up'],['Team capacity','Running low']], 'Sustainable delivery is a product constraint, not a perk.',[
    o('Keep the overtime for one more week','Gain throughput; borrow heavily from the team.',.5,{delivery:7,team:-11,quality:-6,energy:-6},{overtime:true},{Engineering:-8},{day:27,text:'Exhaustion causes a release handoff mistake.',effects:{quality:-7,team:-4}}),
    o('Reduce scope and protect recovery','Lose some features; improve sustainable delivery.',1,{team:12,quality:5,delivery:2,business:-3},{overtime:false},{Engineering:8}),
    o('Move the date and own the message','Recover capacity; take the commercial hit.',1,{team:11,quality:7,business:-7},{overtime:false,launchSlip:2},{Engineering:7,CEO:-4}),
    o('Rotate workload and remove meetings','Keep momentum; coordination needs care.',1.5,{team:8,delivery:4,energy:4},{overtime:false},{Engineering:5})
  ]),
  s('demo',20,'An investor demo. Tomorrow.','ceo','CEO','Alex wants a new workflow for tomorrow’s investor demo. It is outside the sprint. The meeting could unlock funding.',[['Demo','Tomorrow'],['Funding impact','Potentially high'],['Sprint','Release candidate']], 'Separate a useful demonstration from a production commitment.',[
    o('Interrupt the sprint for the feature','Help the pitch; destabilize the release.',1.5,{business:9,delivery:-7,quality:-4,team:-3},{demo:true},{CEO:7,Engineering:-4}),
    o('Build a clearly labeled demo prototype','Support the story; prevent an accidental promise.',2,{business:7,delivery:2,strategy:4},{demo:true},{CEO:5,Engineering:2}),
    o('Show the working release instead','A credible demo; less novelty.',1,{quality:3,business:4,delivery:4},{demo:false},{Engineering:3,CEO:-1}),
    o('Trade another sprint item out','Respect the team; lose planned customer value.',1,{business:6,delivery:2,customer:-3},{demo:true},{CEO:4})
  ]),
  s('campaign',21,'The launch budget is already spent','sales','Marketing','Noor has committed the media budget. Moving the campaign loses part of that spend. Keeping it may push users toward a shaky release.',[['Campaign spend','Committed'],['Flexibility','Limited'],['Release','In beta']], 'Product choices sit inside wider organizational commitments.',[
    o('Keep the full campaign date','Protect momentum; widen the launch blast radius.',1,{business:8,quality:-3},{campaign:'full'},{Marketing:6}),
    o('Move the campaign and accept the cost','Reduce exposure; lose committed spend.',1,{quality:6,business:-8},{campaign:'delayed'},{Marketing:-5,QA:3}),
    o('Use the campaign for a waitlist','Preserve demand; postpone conversion.',1.5,{business:4,strategy:5},{campaign:'waitlist'},{Marketing:3}),
    o('Start with a smaller targeted cohort','Learn with limits; more operational coordination.',1.5,{quality:4,business:3,customer:3},{campaign:'cohort'},{Marketing:2,Support:2})
  ]),
  s('support',23,'Support knows 60% of the new flows','coffee','Support','Riley’s team can handle the common path, but not the edge cases. The release includes new permissions, setup, and billing behavior.',[['Flow coverage','60%'],['Training needed','1 day'],['Escalations','Not defined']], 'Operational readiness is part of the product experience.',[
    o('Run a rapid training session','Equip the front line; spend launch preparation time.',2,{quality:6,customer:7,team:4},{supportReady:true},{Support:8}),
    o('Launch with an engineering escalation channel','Recover quickly; burden the builders.',1,{delivery:4,quality:2,team:-2},{escalation:true},{Support:3,Engineering:-3}),
    o('Reduce the release to supported flows','Fewer surprises; a narrower launch.',1,{quality:7,delivery:3,business:-4},{supportReady:true,reduced:true},{Support:5}),
    o('Delay one day for training','Improve readiness; absorb schedule cost.',1,{quality:8,team:4,business:-5},{supportReady:true,launchSlip:1},{Support:7,CEO:-2})
  ]),
  s('tracking',25,'The key event is not being tracked','analytics','Engineering','Activation events are missing for a subset of teams. Your primary metric may not be trustworthy after launch.',[['Event completeness','74%'],['Impact','Activation signal'],['Repair','Half a day']], 'If you cannot see the outcome, you cannot learn from the release.',[
    o('Fix instrumentation before launch','Reliable learning; less time for polish.',2,{strategy:9,quality:4,delivery:-3},{analyticsReady:true},{Engineering:4,Research:5}),
    o('Launch and repair it later','Preserve speed; fly with incomplete instruments.',.5,{delivery:7,strategy:-6},{analyticsReady:false},{CEO:2},{day:29,text:'Missing activation events make the launch funnel impossible to interpret confidently.',effects:{strategy:-7}}),
    o('Use a limited, fully tracked cohort','Trust one slice; slow broader growth.',1.5,{customer:5,strategy:6,business:-2},{analyticsReady:true,trackedCohort:true},{Research:4}),
    o('Define a documented proxy metric','Some visibility; imperfect attribution.',1,{strategy:4,customer:2},{analyticsProxy:true},{Research:2})
  ]),
  s('launch',27,'This is your go / no-go','war','CEO','Alex asks, “Can we go live?” Dan says technically yes. Sam would prefer another day. Noor’s campaign is ready. Riley is watching support capacity. You own the call.',[['Feature completion','94%'],['Crash-free sessions','98.7%'],['Beta NPS','31']], 'A launch decision is a risk decision. Make it reversible.',[
    o('GO. Release to everyone.','Maximum momentum; maximum exposure.',1,{business:12,delivery:8,quality:-4},{rollout:'full',launched:true},{CEO:6,Marketing:5,QA:-4}),
    o('Limited rollout. Start with 10%.','Contain risk and learn; slower commercial growth.',1.5,{quality:6,customer:6,business:3,strategy:5},{rollout:'limited',launched:true},{Engineering:5,QA:5,CEO:-1}),
    o('Delay. Fix the risks first.','More reliable launch; a visible business cost.',1.5,{quality:12,team:6,business:-10},{rollout:'delayed',launched:true,launchSlip:2,paymentFixed:true,bugs:-2},{QA:7,CEO:-6,Marketing:-4})
  ],'launch'),
  s('incident',28,'Traffic is up. Payments are down.','war','Engineering','Launch traffic is 3× the forecast. Payment success drops. Support tickets rise. The team is investigating, but the root cause is not confirmed.',[['Traffic','3× forecast'],['Payment success','91.4%'],['Root cause','Investigating']], 'Contain impact before certainty. Recovery is a product decision.',[
    o('Pause acquisition and investigate','Reduce incoming harm; sacrifice growth momentum.',1.5,{quality:8,business:-5,customer:4},{incidentResolved:true},{Engineering:5,Marketing:-2}),
    o('Roll back to the stable release','Restore service; reverse launch momentum.',2,{quality:12,business:-7,team:4},{incidentResolved:true,rolledBack:true},{QA:6,CEO:-3}),
    o('Stay live while the team investigates','Keep learning and revenue; ongoing customer harm.',1,{business:5,quality:-9,customer:-6},{incidentResolved:false},{CEO:2,Support:-5},{day:29,text:'The unresolved incident increases support tickets and erodes customer trust.',effects:{quality:-5,customer:-6}}),
    o('Disable payments behind a flag','Limit harm to one path; block new revenue.',1,{quality:9,business:-6,customer:3},{incidentResolved:true,paymentDisabled:true},{Engineering:4,Support:4})
  ],'incident'),
  s('growth',28,'More users will not fix retention','analytics','Marketing','Acquisition looks strong. The Day 7 retention projection is only 19%. Alex suggests buying more traffic.',[['Day 1 retention','61%'],['Day 7 projection','19%'],['Acquisition','Growing']], 'Growth cannot fix a product people do not retain.',[
    o('Increase acquisition spend','More reach; feed a leaky funnel.',1,{business:4,customer:-6,strategy:-5},{acquisition:true},{Marketing:4}),
    o('Investigate why teams leave','Better understanding; slower expansion.',2,{customer:11,strategy:8,business:-2},{retentionWork:true},{Research:6}),
    o('Improve the first-value experience','Act on likely friction; verify the hypothesis later.',2,{customer:8,quality:7,delivery:-3},{retentionWork:true,onboarding:true},{Design:5}),
    o('Focus on the teams who stay','Deepen a strong signal; narrow the market.',1.5,{customer:7,business:5,strategy:5},{powerFocus:true},{Sales:3})
  ]),
  s('flood',28,'Support is flooded with setup questions','coffee','Support','Tickets are up 43%. The most common complaint: “I cannot understand setup.” Your decisions about onboarding are now customer conversations.',[['Support tickets','+43%'],['Top complaint','Confusing setup'],['Team','At capacity']], 'Help content may treat the symptom. Product design may treat the cause.',[
    o('Rewrite the help center','Fast assistance; friction remains inside the product.',1,{customer:5,quality:3},{helpDocs:true},{Support:4}),
    o('Improve setup in the product','Remove recurring friction; consume build capacity.',2,{customer:10,quality:8,delivery:-3},{onboarding:true},{Design:5,Support:6}),
    o('Add temporary support coverage','Respond quickly; add operating cost.',1,{business:-4,customer:5,team:3},{supportReady:true},{Support:6}),
    o('Wait for another week of data','Avoid a premature change; customers wait too.',.5,{strategy:2,customer:-6,team:-3},{},{Support:-5})
  ]),
  s('power',29,'An unexpected workflow','research','Research','A small set of teams uses Orbit four times more than average. They have turned decisions into a lightweight operations log. Nobody designed that workflow.',[['Segment','Small operations teams'],['Usage','4× average'],['Intent','Not yet understood']], 'Unexpected behavior can be a discovery signal, not a roadmap mandate.',[
    o('Interview the power users','Understand value; resist an immediate promise.',1.5,{customer:10,strategy:7},{powerResearch:true},{Research:5}),
    o('Productize the workflow immediately','Capture momentum; bet on a small sample.',2,{business:7,delivery:-5,strategy:-2},{powerFocus:true},{Sales:4}),
    o('Keep focus on the core segment','Protect direction; miss a possible opportunity.',.5,{delivery:4,strategy:2,customer:-3},{},{Research:-2}),
    o('Run a small workflow experiment','Test demand; add some complexity.',1.5,{customer:7,business:4,strategy:5},{powerResearch:true},{Design:3})
  ]),
  s('conflicting',29,'Activation up. Revenue down.','analytics','CEO','More teams activate, but high-value customers leave before conversion. Your headline metric hides a meaningful cohort difference.',[['Activation','Improving'],['Revenue','Declining'],['High-value teams','Dropping before payment']], 'Aggregate metrics can conceal the product problem.',[
    o('Optimize activation further','Stay consistent; miss commercial friction.',1,{customer:3,business:-6,strategy:-3},{},{CEO:-3}),
    o('Segment the funnel by customer type','Reveal the pattern; spend time on analysis.',1.5,{strategy:9,business:6,customer:5},{segmented:true},{Research:4,Sales:3}),
    o('Interview the high-value cohort','Understand the purchase barrier; slower certainty.',2,{customer:9,business:7},{segmented:true},{Sales:5}),
    o('Switch the KPI to revenue','Align the story; the underlying cause remains.',.5,{business:4,strategy:-2},{metric:'Revenue per team'},{CEO:3})
  ]),
  s('victory',29,'The executive victory lap','ceo','CEO','Alex celebrates the launch publicly. Internally, signals are mixed. The team deserves recognition. The product still needs attention.',[['Launch','Publicly celebrated'],['Metrics','Mixed'],['Team','Ready for a breath']], 'Timing is part of stakeholder communication.',[
    o('Join the celebration','Build morale; the risks need another forum.',.75,{team:7,business:2,strategy:-2},{},{CEO:5}),
    o('Raise every concern immediately','Keep risks visible; overshadow the team effort.',1,{strategy:7,team:-5},{},{CEO:-5}),
    o('Celebrate, then schedule the review','Recognize effort and preserve learning.',1.25,{team:8,strategy:7},{review:true},{CEO:4,Engineering:4}),
    o('Say nothing and get back to work','Preserve time; leave the story unchallenged.',.25,{delivery:3,team:-3,strategy:-3},{},{CEO:-1})
  ]),
  s('competitor',30,'The competitor reacts','sales','Sales','A competitor announces a similar team workflow. Sales asks for a roadmap response before customer calls this afternoon.',[['Announcement','Similar workflow'],['Your evidence','From live teams'],['Pressure','Growing']], 'Competitor movement is context, not a product strategy.',[
    o('Accelerate the roadmap','Show momentum; increase delivery pressure.',1,{business:5,delivery:-5,quality:-3},{},{Sales:4}),
    o('Ignore the announcement','Keep focus; risk missing a positioning change.',.5,{delivery:3,strategy:-2},{},{Sales:-3}),
    o('Analyze positioning against user needs','Use context; avoid a reflexive feature race.',1.5,{strategy:8,business:5},{},{Sales:3}),
    o('Communicate your differentiated outcome','Equip Sales; validate the claim with evidence.',1,{business:7,strategy:5},{},{Sales:5})
  ]),
  s('pricing',30,'Is it time to charge?','sales','CEO','The business wants revenue. Teams are still learning the product. A price can validate value, but also change who participates.',[['Market signal','Early'],['Business need','Revenue'],['Value evidence','Uneven']], 'Pricing is a hypothesis about value. Test the hypothesis.',[
    o('Monetize the whole release','Immediate revenue; risk shrinking the learning pool.',1,{business:9,customer:-4},{paid:true},{CEO:5}),
    o('Keep it free while learning','Broader learning; a postponed revenue signal.',.5,{customer:6,business:-5},{paid:false},{CEO:-3}),
    o('Test pricing with a small cohort','Validate willingness to pay; manage extra complexity.',1.5,{business:7,customer:5,strategy:6},{pricingTest:true},{CEO:3,Research:3}),
    o('Price advanced team workflows','Align value to segment; build clearer packaging.',1.5,{business:8,strategy:5},{paid:true,segmented:true},{Sales:4})
  ]),
  s('kill',30,'The feature nobody would miss','product','Engineering','One launch feature has low usage, low satisfaction, and a high maintenance cost. It was politically important during planning.',[['Usage','Low'],['Satisfaction','Low'],['Maintenance','High']], 'Removing a feature is a product decision, too.',[
    o('Retire it with a migration plan','Recover focus; handle affected customers carefully.',1,{strategy:9,delivery:6,quality:4,business:-1},{killed:true},{Engineering:5}),
    o('Invest in improving it','Give it another chance; commit more capacity.',1.5,{customer:4,delivery:-5,strategy:-1},{},{Design:3}),
    o('Hide it from new teams','Reduce confusion; maintenance remains.',.75,{quality:4,customer:3},{},{Design:2}),
    o('Wait for more usage','Avoid a hard choice; keep the recurring cost.',.25,{strategy:-5,delivery:-3},{},{Engineering:-3})
  ]),
  s('recognition',30,'Who gets the credit?','meeting','Engineering','The release is out. Engineers, designers, researchers, QA, Sales, Marketing, and Support all carried part of it. How do you close this chapter?',[['Release','Delivered'],['Next step','A learning review'],['People','Still here tomorrow']], 'Recognition shapes who helps you the next time things get difficult.',[
    o('Recognize the whole cross-functional team','Build shared ownership; make the contributions specific.',.75,{team:10,energy:4},{review:true},{Engineering:4,Design:4,QA:4,Support:4}),
    o('Highlight the delivery heroes','Reward the rescue; invisible work may feel overlooked.',.5,{team:5,delivery:3},{},{Engineering:5,Research:-3,Support:-3}),
    o('Thank contributors individually','Personal appreciation; less shared story.',1,{team:8,energy:2},{},{Engineering:3,Design:3,Research:3}),
    o('Move straight to the next sprint','Preserve time; the team needs a moment.',.25,{delivery:4,team:-7,energy:-3},{},{Engineering:-4,Design:-3})
  ])
];
export const features = [
  {id:'ai',name:'AI Search',points:21,value:'High potential',evidence:'Low',risk:'High',dependency:'Search index',description:'Natural-language search across workspace decisions.'},
  {id:'collab',name:'Team Collaboration',points:13,value:'Very high',evidence:'Strong',risk:'Medium',dependency:'Permissions',description:'Capture, assign, and resolve shared team decisions.'},
  {id:'pdf',name:'Export PDF',points:5,value:'Medium',evidence:'Moderate',risk:'Low',dependency:'Activity data',description:'Share a readable snapshot with clients and external teams.'},
  {id:'filters',name:'Advanced Filters',points:8,value:'Segment-specific',evidence:'Moderate',risk:'Medium',dependency:'Data model',description:'Find decisions by owner, status, team, and date.'},
  {id:'dashboard',name:'Dashboard',points:8,value:'High',evidence:'Strong',risk:'Low',dependency:'Activity events',description:'Give teams one view of decisions waiting for action.'},
  {id:'notifications',name:'Notifications',points:8,value:'High',evidence:'Moderate',risk:'Medium',dependency:'Event delivery',description:'Tell owners when a decision needs their attention.'},
  {id:'admin',name:'Admin Controls',points:8,value:'Medium',evidence:'Moderate',risk:'Medium',dependency:'Permissions',description:'Manage access and workspace configuration.'},
  {id:'sso',name:'SSO',points:13,value:'High for enterprise',evidence:'Low',risk:'High',dependency:'Identity vendor',description:'Let large customers use their organization sign-in.'},
  {id:'dark',name:'Dark Mode',points:3,value:'Low',evidence:'Low',risk:'Low',dependency:'Design tokens',description:'A new appearance. Requested passionately by one teammate.'},
  {id:'feed',name:'Activity Feed',points:6,value:'High',evidence:'Strong',risk:'Low',dependency:'Activity events',description:'See what changed, who decided, and what happens next.'}
];
scenarios.push(
  s('readiness',22,'Everyone means something different by ready','meeting','QA','Release candidate 1.0 is almost complete. Engineering reports code readiness. QA reports two critical defects. Marketing reports a fixed date. Define the evidence behind the launch decision.',[['Completion','94%'],['Critical bugs','2 in the baseline'],['Support','Still preparing']], 'Readiness is a shared interpretation of several imperfect signals.',[
    o('Agree on explicit release gates','Create a shared contract; spend alignment time.',1.5,{strategy:8,quality:5,team:4},{releaseGates:true},{QA:5,Engineering:4}),
    o('Treat feature completion as readiness','Simple decision; operational risk stays hidden.',.5,{delivery:5,quality:-5,strategy:-4},{},{CEO:3,QA:-4}),
    o('Ask each team for its top risk','Expose uncertainty; the final trade-off still needs an owner.',1,{strategy:5,team:5,quality:3},{releaseGates:true},{QA:4,Support:4})
  ],'meeting'),
  s('rollback',24,'What happens if we need to undo this?','engineering','Engineering','The rollout plan is written. The rollback plan is one line: “Revert if needed.” Dan asks who can make the call, what triggers it, and whether the migration is reversible.',[['Rollback owner','Unassigned'],['Data migration','Partially reversible'],['Trigger','Not agreed']], 'Reversibility changes the risk of a release.',[
    o('Rehearse rollback and assign an owner','A recoverable release; spend preparation capacity.',2,{quality:9,team:4,delivery:-2},{rollbackReady:true,featureFlag:true},{Engineering:6,QA:4}),
    o('Write a clear runbook and triggers','Better coordination; some untested assumptions remain.',1,{quality:6,strategy:5},{rollbackReady:true},{Engineering:4}),
    o('Trust the team to handle it live','Protect speed; leave authority and recovery ambiguous.',.5,{delivery:5,quality:-4},{rollbackReady:false},{Engineering:-3})
  ]),
  s('load',26,'The dress rehearsal','war','Engineering','A load test simulates three times forecast traffic. Queue latency grows. The team has one day left before the go / no-go conversation.',[['Traffic tested','3× forecast'],['Queue latency','Increasing'],['Tomorrow','Launch decision']], 'A rehearsal is useful when its evidence changes the plan.',[
    o('Add capacity and rerun the test','More resilience; spend time and operating budget.',2,{quality:9,business:-4,delivery:-2},{infraReady:true},{Engineering:5}),
    o('Set a rollout cap and alert thresholds','Control exposure; accept slower growth.',1,{quality:7,strategy:5},{infraReady:true,rolloutCap:true},{Engineering:4,QA:3}),
    o('Accept the risk and launch as planned','Preserve momentum; real users will run the next test.',.5,{delivery:6,business:3,quality:-5},{infraReady:false},{CEO:3,Engineering:-3})
  ])
);
export const socialEvents = [
  {id:'coffee',title:'Coffee with Support',person:'Support',room:'coffee',hours:.5,description:'Riley knows the customer complaints before the dashboard does.',effects:{customer:4,team:2},relations:{Support:5}},
  {id:'lunch',title:'Lunch with Maya',person:'Design',room:'design',hours:1,description:'A conversation without a review deck. Some alignment happens over lunch.',effects:{team:4,quality:2},relations:{Design:6}},
  {id:'drinks',title:'Team drinks',person:'Engineering',room:'coffee',hours:2,description:'The team is heading out. Your PRD will still be there tomorrow.',effects:{team:7,energy:-2},relations:{Engineering:5,Design:3}},
  {id:'birthday',title:'Sam’s office birthday',person:'QA',room:'coffee',hours:.5,description:'Ten people. One cake. Zero action items.',effects:{team:4,energy:3},relations:{QA:5}},
  {id:'memes',title:'The team meme thread',person:'Engineering',room:'coffee',hours:.25,description:'“This could have been an email” has acquired a sequel.',effects:{team:2,energy:2},relations:{Engineering:2}}
];
export const roomInfo = {
  product:{name:'Product desk',subtitle:'A little clarity in a lot of ambiguity.',person:'Research'},
  engineering:{name:'Engineering',subtitle:'The estimate is information. The deadline is a conversation.',person:'Engineering'},
  design:{name:'Design studio',subtitle:'Where technically working becomes actually useful.',person:'Design'},
  research:{name:'Research corner',subtitle:'Talk to the people behind the numbers.',person:'Research'},
  analytics:{name:'Analytics wall',subtitle:'Look past the headline metric.',person:'Research'},
  ceo:{name:'CEO office',subtitle:'A big vision. A few small requests.',person:'CEO'},
  sales:{name:'Sales & marketing',subtitle:'A promise is another kind of dependency.',person:'Sales'},
  meeting:{name:'Meeting room',subtitle:'Please leave with a decision.',person:'Design'},
  war:{name:'War room',subtitle:'Assess the risk. Make the call. Own the outcome.',person:'QA'},
  coffee:{name:'Coffee corner',subtitle:'Relationships are part of the system.',person:'Support'}
};
