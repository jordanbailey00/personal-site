import {
    PaperCallout,
    PaperLead,
    PaperMetrics,
    PaperSection,
    PaperSubsection,
    PaperTable,
    ScreenshotPlaceholder,
    StatusItem,
    StatusList,
    bodyCopy,
} from "./paper/PaperElements";
import SyntaxCodeBlock from "./paper/SyntaxCodeBlock";

const observationContract = `/* The policy sees player state, eight NPC slots, and wave metadata. */
#define FC_OBS_PLAYER_SIZE      17
#define FC_OBS_NPC_STRIDE       12
#define FC_OBS_NPC_SLOTS         8
#define FC_OBS_NPC_TOTAL        (FC_OBS_NPC_STRIDE * FC_OBS_NPC_SLOTS)
#define FC_OBS_META_SIZE         9
#define FC_POLICY_OBS_SIZE      (FC_OBS_PLAYER_SIZE + FC_OBS_NPC_TOTAL + FC_OBS_META_SIZE)

/* Reward features are adjacent in memory, but hidden from the policy. */
#define FC_REWARD_FEATURES      19
#define FC_TOTAL_OBS            (FC_POLICY_OBS_SIZE + FC_REWARD_FEATURES)

/* The simulator has two viewer pathfinding heads; training uses the first five. */
#define FC_NUM_ACTION_HEADS      7
#define FC_ACT_SIZES { FC_MOVE_DIM, FC_ATTACK_DIM, FC_PRAYER_DIM, \
                       FC_EAT_DIM, FC_DRINK_DIM, \
                       FC_MOVE_TARGET_X_DIM, FC_MOVE_TARGET_Y_DIM }`;

const tickCode = `void fc_tick(FcState* state, const int actions[FC_NUM_ACTION_HEADS]) {
    int prayer_active_at_tick_start =
        (state->player.prayer != PRAYER_NONE);

    clear_per_tick_flags(state);
    process_player_actions(state, actions);
    decrement_player_timers(&state->player);
    fc_prayer_drain_tick(&state->player, prayer_active_at_tick_start);

    for (int i = 0; i < FC_MAX_NPCS; i++)
        fc_npc_tick(state, i);

    fc_resolve_player_pending_hits(state);
    for (int i = 0; i < FC_MAX_NPCS; i++)
        if (state->npcs[i].active)
            fc_resolve_npc_pending_hits(state, i);

    check_terminal(state);
    state->tick++;
}`;

const adapterCode = `/* Step the simulation and derive this transition's reward. */
fc_step(&env->state, actions);
env->rewards[0] = fc_puffer_compute_reward(env);
env->ep_length++;

/* The agent must see the terminal state observation,
 * not the next episode's reset observation. */
fc_puffer_write_obs(env);

if (fc_is_terminal(&env->state)) {
    env->terminals[0] = 1.0f;
    /* Episode metrics are recorded here; reset follows externally. */
}`;

const rewardCode = `FcRewardBreakdown out;
memset(&out, 0, sizeof(out));
fc_write_reward_features(state, out.raw);

/* A large mistake costs more than several small scratches. */
{
    float dmg_frac = out.raw[FC_RWD_DAMAGE_TAKEN];
    out.damage_taken =
        dmg_frac * dmg_frac * 70.0f * params->w_damage_taken;
}

if (out.raw[FC_RWD_WAVE_CLEAR] > 0.0f) {
    int cleared_wave = state->current_wave - 1;
    if (cleared_wave < 1) cleared_wave = 1;
    out.wave_clear = params->w_wave_clear * (float)cleared_wave;
}`;

const configCode = `[vec]
total_agents = 4096
num_buffers = 2

[train]
total_timesteps = 3_000_000_000
learning_rate = 0.0009
gamma = 0.996327
gae_lambda = 0.96405
clip_coef = 0.1783
ent_coef = 0.02423
vf_coef = 1
max_grad_norm = 0.25

[policy]
hidden_size = 256
num_layers = 3`;

export default function FightCavesRLCaseStudy() {
    return (
        <article className="space-y-16">
            <PaperLead>
                <p>
                    Fight Caves RL asks whether a reinforcement-learning agent can learn the entire Old School RuneScape Fight Caves from scratch. A successful episode lasts 63 waves. Early waves introduce one enemy at a time; later waves combine melee, ranged, and magic attackers; the final wave adds TzTok-Jad, whose attacks must be answered with the correct protection prayer while healers enter the arena. The policy receives game state, chooses game actions, and receives a scalar reward. It is not given demonstrations or a scripted solution.
                </p>
                <p>
                    The project is more than a training script. I built a deterministic C simulator, a reinforcement-learning interface, a recurrent PPO training system, experiment tracking, and a 3D viewer that can run a human player or a trained checkpoint through the same action contract. Most of the work was spent making the environment faithful enough to require the real strategy, fast enough to run billions of steps, and observable enough that a neural policy could learn that strategy.
                </p>
            </PaperLead>

            <PaperMetrics
                metrics={[
                    ["94.9%", "peak Jad kill rate"],
                    ["~1.9M", "simulation steps / second"],
                    ["4,096", "parallel environments"],
                    ["~26 min", "three-billion-step run"],
                ]}
            />

            <PaperCallout>
                These headline measurements are from the published v35.1 configuration on an RTX 5070 Ti. The 94.9% number is a peak evaluation checkpoint, not the final checkpoint of every run. Performance is measured in the simulator rather than against the live game client.
            </PaperCallout>

            <ScreenshotPlaceholder>
                the Raylib arena during a late wave, with the agent, collision geometry, active enemies, overhead prayers, and policy telemetry visible
            </ScreenshotPlaceholder>

            <PaperSection title="1. Defining the problem">
                <p className={bodyCopy}>
                    The Fight Caves is a useful long-horizon control problem because success depends on several kinds of reasoning at once. The agent must preserve limited food and prayer points, recognize which incoming attack is dangerous, switch protection prayers before a hit is locked in, choose targets, move around collision, exploit line of sight, and avoid spending thousands of ticks on a locally safe but globally useless behavior. A mistake on wave 60 can erase the value of every correct decision made before it.
                </p>
                <p className={bodyCopy}>
                    “From scratch” has a precise meaning here. Training begins from randomly initialized policy weights. There is no behavior-cloning dataset, no expert trajectory, and no hard-coded phase controller that takes over for Jad. Curriculum and reward shaping can change which states the policy encounters and which outcomes are reinforced, but the policy still has to infer the action sequence from interaction.
                </p>
                <PaperSubsection title="What counts as a solution">
                    <p className={bodyCopy}>
                        I track several outcomes rather than reducing the run to average reward. Wave-63 reach rate measures whether the policy can manage the preceding cave. Jad kill rate measures full completion. Resource use, damage taken, prayer correctness, idle time, and per-wave deaths help explain why a configuration succeeds or fails. This separation matters: a policy can produce a high shaped reward while stalling, or reach Jad consistently while failing the prayer-and-healer phase.
                    </p>
                </PaperSubsection>
            </PaperSection>

            <PaperSection title="2. System architecture">
                <p className={bodyCopy}>
                    The system has three runtime layers. <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">fc-core</code> is a pure C state machine containing the arena, waves, NPC behavior, collision, combat, observations, masks, and rewards. The PufferLib adapter exposes thousands of independent core states to PPO with contiguous buffers. The Raylib viewer reads the same state and writes the same actions, adding interpolation and diagnostics without owning game rules.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        ["fc-core", "Deterministic, rendering-free simulation with no allocation in the tick loop."],
                        ["PufferLib 4", "Vectorized environment buffers, recurrent PPO, evaluation, checkpoints, and experiment telemetry."],
                        ["3D viewer", "Human play, live policy playback, collision inspection, reward channels, and episode debugging."],
                    ].map(([name, description]) => (
                        <div key={name} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                            <h3 className="font-mono text-sm text-white/85">{name}</h3>
                            <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                        </div>
                    ))}
                </div>
                <p className={bodyCopy}>
                    Keeping rendering outside the simulator makes the training path headless and reproducible. Keeping the human and policy paths on one action interface provides a stronger check: if the viewer mutates state directly, it can appear correct while the agent is training against different rules. Here, a mouse click becomes the same movement-head values consumed by a training episode.
                </p>
            </PaperSection>

            <PaperSection title="3. The deterministic simulator">
                <p className={bodyCopy}>
                    An episode uses a 64-by-64 collision arena, one player, at most 16 active NPCs, 63 wave definitions, and 15 official spawn rotations. Each state owns its random generator and all mutable timers. Resetting two environments with the same seed and replaying the same action vectors should produce identical state transitions.
                </p>
                <p className={bodyCopy}>
                    Tick ordering is part of the environment contract. Prayer is instantaneous and therefore processed before queued attacks resolve. Eating and drinking have cooldowns. Movement can alter distance and line of sight before NPC decisions. Pending hits carry the information needed to resolve later, rather than looking up a possibly changed attack style at impact time.
                </p>
                <SyntaxCodeBlock code={tickCode} language="c" filename="fc-core/src/fc_tick.c" />
                <p className={bodyCopy}>
                    Fixed-size arrays replace per-tick heap allocation. That design trades some unused capacity for predictable memory access and removes allocator contention when 4,096 environments advance in parallel. It also makes state inspection straightforward: the viewer and test tools can copy or compare a state without reconstructing an object graph.
                </p>
                <PaperSubsection title="Combat fidelity without a full game client">
                    <p className={bodyCopy}>
                        The simulator implements the mechanics that affect Fight Caves decisions: attack speeds, ranges, accuracy, max hits, melee approach, projectile delay, protection-prayer snapshots, line of sight, NPC footprint collision, wave spawning, Jad attack commitments, healer behavior, food, prayer potions, and death. It deliberately omits unrelated RuneScape systems. The goal is a controlled task model, not a second general-purpose client.
                    </p>
                    <p className={bodyCopy}>
                        This boundary is important when interpreting the result. A high clear rate demonstrates learning inside this mechanics model. It does not prove direct transfer to the live client, whose visual input, latency, interface, and unmodeled mechanics create a different observation and control problem.
                    </p>
                </PaperSubsection>
            </PaperSection>

            <PaperSection title="4. Observation and action design">
                <p className={bodyCopy}>
                    The policy receives 122 normalized float values. Seventeen describe the player: health, prayer, position, timers, active protection prayer, remaining supplies, incoming-hit counts, and selected target. Eight deterministic NPC slots contribute 12 values each, including position, health, distance, attack telegraph, timer, line of sight, pending style, and impact time. Nine values describe the wave and recent events.
                </p>
                <SyntaxCodeBlock code={observationContract} language="c" filename="fc-core/include/fc_contracts.h" />
                <p className={bodyCopy}>
                    When more than eight NPCs are alive, the observation contains the eight closest. Slots are sorted first by Chebyshev distance and then by spawn index. That tie-breaker is not cosmetic: unstable slot ordering makes the meaning of “attack slot 3” change between otherwise identical runs. Overflow NPCs remain active in the simulator even though they cannot be directly selected until they enter the visible set.
                </p>
                <p className={bodyCopy}>
                    Training uses five categorical action heads. Movement has 17 choices: idle, eight one-tile directions, and eight two-tile run directions. Attack selects none or one of eight NPC slots. Prayer chooses no change, off, protect magic, protect ranged, or protect melee. Eat and drink heads control consumables. The core also defines target-tile heads for human click-to-move, but the training adapter disables those higher-level actions so PPO has to choose low-level movement.
                </p>
                <PaperSubsection title="Action masks">
                    <p className={bodyCopy}>
                        The adapter appends 36 mask values for the five training heads. A wall masks an illegal movement direction; empty NPC slots mask attack targets; exhausted supplies mask eating or drinking. Masks prevent the optimizer from spending probability mass on impossible actions. Prayer remains available because changing or disabling a prayer is often meaningful even when no attack is landing on the current tick.
                    </p>
                </PaperSubsection>
            </PaperSection>

            <PaperSection title="5. Reward design and the behaviors it created">
                <p className={bodyCopy}>
                    The core emits 19 reward features separately from the 122 policy inputs. The trainer converts those features into a scalar using configuration weights. This prevents reward-only facts from leaking into the policy while keeping experiments configurable: I can change the cost of wasted food or a Jad-heal event without recompiling observation logic.
                </p>
                <SyntaxCodeBlock code={rewardCode} language="c" filename="fc-core/include/fc_reward.h" />
                <p className={bodyCopy}>
                    The published v35 recipe rewards damage dealt, kills, wave clears, correct protection, kiting, safe attacks, and Jad completion. It penalizes damage, death, incorrect prayer, wasted resources, invalid actions, unnecessary prayer, and very long stalls. Damage cost is quadratic in the fraction of health lost, so one catastrophic hit is worse than several small errors with the same total damage. Wave-clear reward scales with wave number because a late clear represents more progress and a rarer state.
                </p>
                <PaperCallout tone="warning">
                    Reward is an engineering interface, not a proof of intent. Every new term can create an alternative way to score. I evaluate cave completion and behavior traces separately from shaped return for exactly that reason.
                </PaperCallout>
                <PaperSubsection title="The stalling failure">
                    <p className={bodyCopy}>
                        An early policy survived for more than 200,000 ticks without clearing the cave. It learned that avoiding damage and collecting survival-related reward was safer than advancing. This was a genuine optimizer success against a flawed objective. I added explicit progress diagnostics, bounded episodes, delayed stall penalties, and outcome-based evaluation so “alive” could no longer stand in for “solving the task.”
                    </p>
                </PaperSubsection>
                <PaperSubsection title="Why prayer reward alone did not work">
                    <p className={bodyCopy}>
                        A direct correct-prayer term initially produced a better score without producing reliable prayer behavior. The policy lacked enough information about committed styles, arrival timing, line of sight, and overlapping threats. Adding pending-hit style and time-to-impact features addressed the information problem. Reward shaping became useful only after the observation made the decision identifiable.
                    </p>
                </PaperSubsection>
            </PaperSection>

            <PaperSection title="6. Training at scale">
                <p className={bodyCopy}>
                    The policy is a three-layer MinGRU with a 256-unit hidden state trained using PPO. Recurrence matters because the current vector does not encode every past event: the network benefits from remembering target changes, previous movement, prayer transitions, and the sequence leading into a wave. PPO collects experience from 4,096 environments across two buffers and updates the policy in batches.
                </p>
                <SyntaxCodeBlock code={configCode} language="ini" filename="config/fight_caves_v35.ini" />
                <p className={bodyCopy}>
                    The configuration shown above is abbreviated, but it captures the scale and principal optimizer values. The published sweep selected a learning rate of 9e-4, discount factor of 0.996327, GAE lambda of 0.96405, entropy coefficient of 0.02423, clipping coefficient of 0.1783, and gradient-norm cap of 0.25. At approximately 1.9 million environment steps per second, a three-billion-step run completes in roughly 26 minutes on the measured RTX 5070 Ti system.
                </p>
                <p className={bodyCopy}>
                    High throughput changes the experiment loop. A configuration can be tested to late-game behavior in minutes, and broad sweeps become practical. It also makes silent correctness errors more expensive: a missing collision file or wrong terminal observation can produce billions of invalid transitions before a curve makes the fault obvious.
                </p>
                <ScreenshotPlaceholder>
                    a Weights & Biases plot showing Jad kill rate, wave-63 reach rate, throughput, and resource use across the v35.1 run
                </ScreenshotPlaceholder>
            </PaperSection>

            <PaperSection title="7. Integration bugs that changed the result">
                <p className={bodyCopy}>
                    Several of the most consequential problems were outside the neural network. They are worth documenting because a reinforcement-learning result is only as valid as the transition data that reaches the optimizer.
                </p>
                <StatusList>
                    <StatusItem>A curriculum helper advanced the environment by repeatedly calling the normal step function. Directly setting the intended wave removed unintended state transitions before the episode began.</StatusItem>
                    <StatusItem>A collision asset was not found on one launch path, so training silently used an open arena. Path discovery and startup checks were tightened; removing permissive fallbacks entirely remains a useful hardening step.</StatusItem>
                    <StatusItem>Shared static BFS scratch memory caused failures when thousands of environments ran concurrently. Moving scratch state out of the shared global path restored environment isolation.</StatusItem>
                    <StatusItem>The adapter initially risked writing the first observation of the reset episode over the terminal observation. Writing reward and terminal state before reset preserved the transition that PPO actually needs.</StatusItem>
                    <StatusItem>The 3D path exposed reversed triangle winding, coordinate mismatches, duplicate render passes, and terrain-color errors. These did not change headless training, but they made policy inspection misleading until fixed.</StatusItem>
                </StatusList>
                <SyntaxCodeBlock code={adapterCode} language="c" filename="pufferlib_4/fight_caves.h" />
                <p className={bodyCopy}>
                    The terminal-observation issue is a small ordering bug with large statistical consequences. If the value function is trained on the reset state while the reward belongs to the death or completion state, the target joins two unrelated episodes. The run may still improve, which makes this class of error harder to detect than a crash.
                </p>
            </PaperSection>

            <PaperSection title="8. Experiment progression">
                <p className={bodyCopy}>
                    The result came from a sequence of measured revisions rather than one final configuration. Early versions established cold-start progress to wave 60. Later versions learned Jad, corrected observation gaps, removed score-inflating reward, and tested PPO settings. The table records milestone configurations from the repository&apos;s run history.
                </p>
                <PaperTable>
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Version</th>
                                <th className="px-5 py-4 font-medium">Change or result</th>
                                <th className="px-5 py-4 font-medium">What it established</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/55">
                            <tr><td className="px-5 py-4 font-mono">v21.2</td><td className="px-5 py-4">First cold-start wave-60 policy</td><td className="px-5 py-4">The agent could learn the long pre-Jad sequence without demonstrations.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v22.1</td><td className="px-5 py-4">1.5% Jad kills from a warm start</td><td className="px-5 py-4">The terminal phase was learnable, but still rare and unstable.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v28.8</td><td className="px-5 py-4">59.1% peak Jad kill rate</td><td className="px-5 py-4">Observation, reward, and arena revisions produced a reliable full-cave policy.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v29.1</td><td className="px-5 py-4">Priority ablation reduced compute by 33%</td><td className="px-5 py-4">A removed sampling mechanism matched or improved deployment quality.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v32</td><td className="px-5 py-4">81.0% after Jad-heal penalty</td><td className="px-5 py-4">Directly controlling the healer failure mode improved completion by 15.4%.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v34</td><td className="px-5 py-4">200-trial Protein sweep; best 88.6%</td><td className="px-5 py-4">Broad hyperparameter search selected the v35 training region.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v35.1</td><td className="px-5 py-4">94.9% peak; ~99% wave-63 reach</td><td className="px-5 py-4">Published best full-supply configuration.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v36</td><td className="px-5 py-4">80.8% peak with no consumables</td><td className="px-5 py-4">The learned control strategy was not only inventory management.</td></tr>
                        </tbody>
                    </table>
                </PaperTable>
                <p className={bodyCopy}>
                    The v29.1 ablation is a useful example of why removal experiments matter. A prioritized sampling feature added compute and complexity, but setting its priority coefficient to zero preserved or improved the metric that mattered. The simpler training path was faster and easier to interpret.
                </p>
            </PaperSection>

            <PaperSection title="9. Published result and late-training degradation">
                <PaperTable>
                    <table className="w-full min-w-[660px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Run</th>
                                <th className="px-5 py-4 font-medium">Peak Jad kill</th>
                                <th className="px-5 py-4 font-medium">Peak step</th>
                                <th className="px-5 py-4 font-medium">Interpretation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/55">
                            <tr><td className="px-5 py-4 font-mono">v32</td><td className="px-5 py-4">81.0%</td><td className="px-5 py-4">1.98B</td><td className="px-5 py-4">Strong pre-sweep baseline.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v34 best</td><td className="px-5 py-4">88.6%</td><td className="px-5 py-4">2.03B</td><td className="px-5 py-4">Best configuration from the 200-trial sweep.</td></tr>
                            <tr><td className="px-5 py-4 font-mono">v35.1</td><td className="px-5 py-4">94.9%</td><td className="px-5 py-4">1.215B</td><td className="px-5 py-4">Current published peak.</td></tr>
                        </tbody>
                    </table>
                </PaperTable>
                <p className={bodyCopy}>
                    v35.1 exceeded 90% Jad kills for a substantial portion of training, roughly 1.1 to 1.6 billion steps. It later degraded, reaching about 62% near three billion steps under the constant 9e-4 learning rate. For deployment I therefore preserve peak evaluation checkpoints instead of assuming the final optimizer state is best.
                </p>
                <p className={bodyCopy}>
                    This degradation remains an open optimization problem. Candidate tests include learning-rate decay after the first stable peak, stronger checkpoint selection, lower late-stage entropy, and multi-seed comparison. Reporting only the best point would hide this behavior; reporting only the final point would hide the policy the run actually discovered.
                </p>
            </PaperSection>

            <PaperSection title="10. Loadout experiments on the development branch">
                <p className={bodyCopy}>
                    A later development branch applies the same training setup to nine equipment loadouts. These runs are exploratory and are not the v35.1 published result. Each sweep trains to 1.5 billion steps with 4,096 environments, two buffers, and the 256-unit, three-layer MinGRU.
                </p>
                <PaperTable>
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Development condition</th>
                                <th className="px-5 py-4 font-medium">Loadout</th>
                                <th className="px-5 py-4 font-medium">Jad kill</th>
                                <th className="px-5 py-4 font-medium">Wave-63 reach</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/55">
                            <tr><td className="px-5 py-4">Full supplies, final</td><td className="px-5 py-4 font-mono">sota_tbow</td><td className="px-5 py-4">91.0%</td><td className="px-5 py-4">97.0%</td></tr>
                            <tr><td className="px-5 py-4">Full supplies, final</td><td className="px-5 py-4 font-mono">armadyl_crossbow</td><td className="px-5 py-4">1.1%</td><td className="px-5 py-4">97.2%</td></tr>
                            <tr><td className="px-5 py-4">No supplies, peak</td><td className="px-5 py-4 font-mono">tbow_masori</td><td className="px-5 py-4">64.1%</td><td className="px-5 py-4">86.9% final</td></tr>
                            <tr><td className="px-5 py-4">No supplies, final</td><td className="px-5 py-4 font-mono">armadyl_crossbow</td><td className="px-5 py-4">10.3%</td><td className="px-5 py-4">81.6%</td></tr>
                        </tbody>
                    </table>
                </PaperTable>
                <p className={bodyCopy}>
                    The crossbow result separates “reach Jad” from “kill Jad”: it traverses the cave reliably but lacks enough effective terminal-phase control or damage to convert. One no-supplies seed with the nominal best bow collapsed completely while another loadout remained strong. That is not evidence that the equipment is inherently worse. It is a reason to repeat seeds and inspect configuration interactions before making a claim.
                </p>
                <p className={bodyCopy}>
                    This sweep also exposed stale native builds as an experiment-integrity risk. The development tooling now records a backend stamp and forces rebuilds when core inputs change, reducing the chance that a run name and its compiled simulator disagree.
                </p>
                <ScreenshotPlaceholder>
                    a grid comparing late-wave behavior and learning curves for the Twisted Bow, Bowfa, and Armadyl crossbow configurations
                </ScreenshotPlaceholder>
            </PaperSection>

            <PaperSection title="11. What the project established">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200/10 bg-emerald-200/[0.025] p-5">
                        <h3 className="text-sm font-medium text-white/80">Working results</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/50">
                            <li>A recurrent PPO policy can learn all 63 waves from randomized weights without demonstrations.</li>
                            <li>The C backend sustains roughly 1.9 million measured simulation steps per second in the published setup.</li>
                            <li>Observation contracts, action masks, and outcome metrics make learned behavior inspectable rather than treating reward as the only result.</li>
                            <li>Human play, policy playback, and headless training share one simulator and action representation.</li>
                        </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200/10 bg-amber-200/[0.025] p-5">
                        <h3 className="text-sm font-medium text-white/80">Limits and next experiments</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/50">
                            <li>The model is a purpose-built simulator; transfer to the live client has not been demonstrated.</li>
                            <li>Peak-to-final degradation needs scheduled optimization and multi-seed evaluation.</li>
                            <li>Permissive asset fallbacks should become strict startup failures for benchmark runs.</li>
                            <li>Loadout conclusions require repeated seeds and controlled statistical comparison.</li>
                        </ul>
                    </div>
                </div>
                <p className={bodyCopy}>
                    The central lesson is that environment engineering and learning are inseparable. The largest gains did not come from making the network arbitrarily larger. They came from repairing missing information, removing misleading incentives, testing simplifications, preserving terminal transitions, and measuring the outcome directly. The trained policy is the visible result, but the durable artifact is a fast and inspectable experimental system for asking why it works.
                </p>
            </PaperSection>
        </article>
    );
}
