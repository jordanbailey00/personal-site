import { AlertTriangle, Check, ImageIcon } from "lucide-react";

const tickDispatcherCode = `void rc_world_tick(RcWorld *world) {
    const uint32_t on = world->enabled;

    /* Base phases run for every configuration. */
    process_player_input(world);
    process_player_route(world);

    if (on & RC_SUB_COMBAT)
        process_player_combat(world);
    if (on & RC_SUB_ENCOUNTER)
        rc_encounter_tick(world);
    if (on & RC_SUB_PRAYER)
        rc_prayer_drain_tick(&world->player);

    world->tick++;
}`;

const configCode = `RcWorldConfig cfg = rc_preset_combat_only();
cfg.seed = 42;

RcWorld *world = rc_world_create_config(&cfg);

while (simulation_is_running) {
    rc_world_tick(world);
}`;

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
    return (
        <section className="space-y-5">
            <h2 className="border-b border-white/5 pb-3 text-2xl font-light tracking-tight text-white">
                {title}
            </h2>
            {children}
        </section>
    );
}

function ScreenshotPlaceholder({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 text-center">
            <ImageIcon className="size-6 text-white/20" />
            <p className="max-w-xl text-sm leading-relaxed text-white/35">[Insert screenshot: {children}]</p>
        </div>
    );
}

function CodeBlock({ children }: { children: string }) {
    return (
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-5 text-xs leading-6 text-white/70 sm:text-sm">
            <code>{children}</code>
        </pre>
    );
}

function StatusItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex gap-3 text-sm leading-7 text-white/60">
            <Check className="mt-1.5 size-4 shrink-0 text-emerald-300/70" />
            <span>{children}</span>
        </li>
    );
}

export default function RuneCCaseStudy() {
    return (
        <article className="space-y-16">
            <div className="space-y-5 text-base leading-8 text-white/65 sm:text-lg">
                <p>
                    RuneC is a single-player Old School RuneScape engine written in C11. The project has two jobs: reproduce game state on deterministic 600 ms ticks, and expose that state to either a Raylib viewer or a headless simulation. The current playable slice is Varrock.
                </p>
                <p>
                    I chose Varrock because it forces the engine to handle more than an isolated combat arena. The city contains directional collision, bridges, multi-level buildings, animated NPCs, shops, quests, skilling locations, and several kinds of combat. Building one dense region exposed the core problems before expanding to the full map.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    ["25", "loaded regions"],
                    ["102,400", "tiles per plane"],
                    ["79", "animated NPC types"],
                    ["50", "encounter specs"],
                ].map(([value, label]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xl font-light text-white sm:text-2xl">{value}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">{label}</div>
                    </div>
                ))}
            </div>

            <ScreenshotPlaceholder>
                a wide Varrock view showing terrain, buildings, the player, and animated NPCs
            </ScreenshotPlaceholder>

            <Section title="Architecture">
                <p className="text-base leading-8 text-white/60">
                    RuneC separates simulation, game-specific content, rendering, and data preparation. That boundary is the main architectural decision in the project.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {[
                        ["rc-core", "A rendering-free C backend for ticks, collision, pathfinding, combat, prayer, skills, events, and deterministic state."],
                        ["rc-content", "OSRS-specific boss scripts, quest state machines, and regional behavior. Generic engine code does not name a boss or quest."],
                        ["rc-viewer", "A Raylib frontend that reads simulation state, handles input and camera movement, and interpolates between game ticks at 60 FPS."],
                        ["tools + data", "Python exporters turn cache and wiki data into compact binary files that C can load without network access or runtime JSON parsing."],
                    ].map(([name, description]) => (
                        <div key={name} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                            <h3 className="font-mono text-sm text-white/85">{name}</h3>
                            <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                        </div>
                    ))}
                </div>
                <p className="text-base leading-8 text-white/60">
                    The viewer never owns game rules. It submits input and renders the resulting world state. This lets tests, reinforcement-learning environments, and the interactive viewer use the same tick implementation.
                </p>
            </Section>

            <Section title="Building the data pipeline">
                <p className="text-base leading-8 text-white/60">
                    The renderer and simulation need terrain, objects, collision flags, models, animations, NPC definitions, items, drops, quests, dialogue, and encounter data. Decoding all of that inside the game would add startup complexity and couple the hot path to several external formats.
                </p>
                <p className="text-base leading-8 text-white/60">
                    RuneC does the expensive work offline. Python tools read the b237 cache and structured reference data, validate identifiers, and emit versioned binary files. The runtime loads those files into fixed C structures. The current development snapshot contains 13,020 items, 2,871 varbits, 597 shops, 3,413 recipes, 201 spells, 858 NPC drop tables, and more than 155,000 dialogue nodes.
                </p>
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 font-mono text-xs leading-7 text-white/50 sm:text-sm">
                    OSRS cache + reference data → Python validation/export → versioned binaries → C loaders → simulation and viewer
                </div>
                <p className="text-base leading-8 text-white/60">
                    This approach keeps the runtime small and reproducible. A simulation does not need Python, a wiki connection, or a cache decoder after the assets have been exported.
                </p>
            </Section>

            <Section title="A configurable simulation core">
                <p className="text-base leading-8 text-white/60">
                    Not every workload needs the whole game. A pathfinding benchmark needs the base world. A boss-training environment needs combat, prayer, equipment, inventory, consumables, and encounters. The full viewer eventually needs every subsystem.
                </p>
                <CodeBlock>{configCode}</CodeBlock>
                <p className="text-base leading-8 text-white/60">
                    Configuration is consumed when the world is created. During a tick, a bitmask decides which subsystem functions run. There is no plugin loader or virtual dispatch in the simulation loop.
                </p>
                <CodeBlock>{tickDispatcherCode}</CodeBlock>
                <p className="text-base leading-8 text-white/60">
                    World state is stored in one contiguous structure with fixed-capacity arrays. That makes deterministic snapshots and rollback straightforward and avoids allocation during a tick. The tradeoff is memory: the current <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">RcWorld</code> is 2,414,032 bytes, or about 2.30 MiB, before shared assets. That is acceptable for the viewer but too large for thousands of parallel worlds. Splitting hot per-tick state from cold and immutable data is a required optimization for large RL runs.
                </p>
            </Section>

            <Section title="Correct ticks and deterministic tests">
                <p className="text-base leading-8 text-white/60">
                    The backend processes input, route planning, NPC movement, combat, hit resolution, prayer drain, stat restoration, and cleanup in a fixed order. Randomness comes from a per-world seeded generator. Two worlds with the same seed and inputs must reach the same state after the same number of ticks.
                </p>
                <ul className="space-y-2">
                    <StatusItem>Directional collision and eight-way BFS pathfinding are checked against exported map flags.</StatusItem>
                    <StatusItem>Pending hits store the protection-prayer state from the queue tick, not the later damage-resolution tick.</StatusItem>
                    <StatusItem>Combat tests exercise accuracy, max-hit formulas, delayed damage, deaths, and same-seed replay.</StatusItem>
                    <StatusItem>Nine current test executables pass, including pathfinding, combat, determinism, encounter loading, primitives, and event dispatch.</StatusItem>
                </ul>
                <ScreenshotPlaceholder>
                    a collision or pathfinding debug overlay showing a route around Varrock walls
                </ScreenshotPlaceholder>
            </Section>

            <Section title="What I tried while rendering bridges">
                <p className="text-base leading-8 text-white/60">
                    Multi-level map data caused one of the clearest failures. Exporting only plane 0 removed roofs and upper floors, but it also removed bridges that are stored on plane 1 and displayed at ground level. Including most plane-1 objects restored the bridges and also introduced unrelated upper-floor geometry.
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Attempt</th>
                                <th className="px-5 py-4 font-medium">Objects</th>
                                <th className="px-5 py-4 font-medium">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/55">
                            <tr>
                                <td className="px-5 py-4">Plane 0 only</td>
                                <td className="px-5 py-4 font-mono">62,196</td>
                                <td className="px-5 py-4">Clean ground floor, but bridges disappeared.</td>
                            </tr>
                            <tr>
                                <td className="px-5 py-4">Plane 0 + non-roof plane 1</td>
                                <td className="px-5 py-4 font-mono">69,554</td>
                                <td className="px-5 py-4">Bridges returned, but the heuristic included upper-floor clutter.</td>
                            </tr>
                            <tr>
                                <td className="px-5 py-4">LINK_BELOW visual-level resolution</td>
                                <td className="px-5 py-4 font-mono">61,387</td>
                                <td className="px-5 py-4">Bridges used plane-1 height while unrelated upper floors stayed hidden.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-base leading-8 text-white/60">
                    The final approach follows the cache&apos;s visual-level rule instead of guessing from object type. A second bug was hidden underneath it: the terrain parser read opcodes as one byte, while the format stores unsigned two-byte values. The broken parser found between zero and two LINK_BELOW tiles. Reading the format correctly found 1,128.
                </p>
                <ScreenshotPlaceholder>
                    side-by-side bridge exports from the plane-0, plane-1 heuristic, and LINK_BELOW versions
                </ScreenshotPlaceholder>
            </Section>

            <Section title="Performance measurements">
                <p className="text-base leading-8 text-white/60">
                    I measured the cost of the configuration gates with an empty-world microbenchmark. Each case ran 20 million release-build ticks on one Intel Core i7-14700F thread with GCC 13.3. The table reports the median of three runs.
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[620px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Configuration</th>
                                <th className="px-5 py-4 font-medium">Optional subsystems</th>
                                <th className="px-5 py-4 font-medium">Million ticks/s</th>
                                <th className="px-5 py-4 font-medium">ns/tick</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-white/55">
                            <tr><td className="px-5 py-4 font-sans">Base only</td><td className="px-5 py-4">0</td><td className="px-5 py-4">650</td><td className="px-5 py-4">1.54</td></tr>
                            <tr><td className="px-5 py-4 font-sans">Skilling only</td><td className="px-5 py-4">3</td><td className="px-5 py-4">663</td><td className="px-5 py-4">1.51</td></tr>
                            <tr><td className="px-5 py-4 font-sans">Combat only</td><td className="px-5 py-4">6</td><td className="px-5 py-4">94</td><td className="px-5 py-4">10.66</td></tr>
                            <tr><td className="px-5 py-4 font-sans">Full game</td><td className="px-5 py-4">12</td><td className="px-5 py-4">92</td><td className="px-5 py-4">10.91</td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="flex gap-3 rounded-xl border border-amber-200/10 bg-amber-200/[0.03] p-5">
                    <AlertTriangle className="mt-1 size-4 shrink-0 text-amber-200/50" />
                    <p className="text-sm leading-7 text-white/50">
                        This isolates dispatcher overhead. It has no active NPCs, pathfinding, rendering, or agent observations, so it is not a full-game throughput result. Combat-only and full-game are also close because several full-game subsystem tick functions are still being implemented. The useful result is narrower: disabling combat and encounters removes their idle tick cost, while lightweight subsystem gates are lost in run-to-run noise.
                    </p>
                </div>
            </Section>

            <Section title="What worked, what did not, and what is next">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200/10 bg-emerald-200/[0.025] p-5">
                        <h3 className="text-sm font-medium text-white/80">Working well</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/50">
                            <li>The core/viewer boundary supports visual play and headless tests without duplicating game rules.</li>
                            <li>Offline binary exports keep data preparation out of the runtime.</li>
                            <li>Seeded state and fixed tick order make regressions reproducible.</li>
                            <li>Visual-level filtering solved bridges without hardcoding individual map objects.</li>
                        </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200/10 bg-amber-200/[0.025] p-5">
                        <h3 className="text-sm font-medium text-white/80">Still incomplete</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/50">
                            <li>The current texture-atlas approach cannot reproduce every repeating OSRS texture correctly. A texture-array renderer is the likely replacement.</li>
                            <li>Some public input functions and subsystem loaders are still stubs. The project is an engine in active development, not a complete game.</li>
                            <li>Encounter data covers 50 bosses, but only a pilot set of shared mechanics and boss scripts is executable.</li>
                            <li>Unloaded collision currently has a permissive fallback in low-level pathfinding. Strict startup validation still needs to close that failure mode.</li>
                        </ul>
                    </div>
                </div>
                <p className="text-base leading-8 text-white/60">
                    The next technical priorities are completing the engine-to-content event wiring, replacing the texture atlas, reducing per-world memory for parallel simulations, and measuring realistic workloads with active NPCs and pathfinding. After those pieces are stable, the same architecture can expand beyond Varrock without turning the viewer into the game engine.
                </p>
            </Section>
        </article>
    );
}
