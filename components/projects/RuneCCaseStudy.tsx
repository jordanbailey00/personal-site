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

const configCode = `RcWorldConfig cfg = rc_preset_combat_only();
cfg.seed = 42;
cfg.regions_dir = "data/regions";
cfg.encounters_path = "data/defs/encounters.bin";

RcWorld *world = rc_world_create_config(&cfg);

while (simulation_is_running) {
    rc_world_tick(world);
}`;

const tickDispatcherCode = `void rc_world_tick(RcWorld *world) {
    const uint32_t on = world->enabled;

    process_player_input(world);
    process_player_route(world);

    for (int i = 0; i < world->npc_count; i++) {
        if (world->npcs[i].active)
            rc_npc_tick(world, &world->npcs[i]);
    }

    if (on & RC_SUB_COMBAT)
        process_npc_combat(world);
    if (on & RC_SUB_ENCOUNTER)
        rc_encounter_tick(world);

    process_player_movement(world);
    if (on & RC_SUB_COMBAT)
        process_player_combat(world);
    if (on & RC_SUB_SKILLS)
        process_player_skilling(world);

    resolve_pending_hits(world);
    if (on & RC_SUB_PRAYER)
        rc_prayer_drain_tick(&world->player);

    world->tick++;
}`;

const collisionCode = `bool rc_can_move(
    const RcWorldMap *map,
    int x, int y,
    int dx, int dy,
    int plane
) {
    int nx = x + dx;
    int ny = y + dy;

    if (dx == 0 && dy == 1)
        return !(rc_get_flags(map, nx, ny, plane) & COL_BLOCK_N);

    if (dx == 1 && dy == 1)
        return !(rc_get_flags(map, nx, ny, plane) & COL_BLOCK_NE)
            && !(rc_get_flags(map, nx, y, plane) & COL_BLOCK_E)
            && !(rc_get_flags(map, x, ny, plane) & COL_BLOCK_N);

    /* Equivalent checks cover the other six directions. */
    return false;
}`;

const bridgeCode = `def resolve_visual_level(world_x, world_y, level):
    LINK_BELOW = 0x2
    tile_flags = get_tile_setting(world_x, world_y, level)

    if level < 3:
        tile_above = get_tile_setting(world_x, world_y, level + 1)
    else:
        tile_above = tile_flags

    resolved = tile_above if tile_above & LINK_BELOW else tile_flags
    return level - 1 if resolved & LINK_BELOW else level`;

const eventCode = `void rc_encounter_init(RcWorld *world) {
    RcEncounterState *state = &world->encounter;
    memset(state, 0, sizeof(*state));

    rc_event_subscribe(world, RC_EVT_NPC_SPAWNED,
                       rc_encounter_on_npc_spawned, state);
    rc_event_subscribe(world, RC_EVT_NPC_DIED,
                       rc_encounter_on_npc_died, state);
    rc_event_subscribe(world, RC_EVT_PLAYER_DAMAGED,
                       rc_encounter_on_player_damaged, state);
}

void rc_event_fire(RcWorld *world, int event, const void *payload) {
    assert(!world->events.dispatching[event]);
    world->events.dispatching[event] = 1;

    RcEventSlot *slot = &world->events.slots[event];
    for (int i = 0; i < slot->count; i++)
        slot->handlers[i].fn(world, event, payload, slot->handlers[i].ctx);

    world->events.dispatching[event] = 0;
}`;

export default function RuneCCaseStudy() {
    return (
        <article className="space-y-16">
            <PaperLead>
                <p>
                    RuneC is a single-player Old School RuneScape engine written in C11. It reproduces game state on deterministic 600-millisecond ticks and exposes that state to either a Raylib viewer or a headless simulation. The current playable slice centers on Varrock, but the engine and data pipeline are designed so regions and systems can be added without moving game rules into the renderer.
                </p>
                <p>
                    I chose a dense city rather than an empty test arena because Varrock makes the architecture confront real map data. It contains directional collision, bridges, multi-level buildings, animated NPCs, shops, quests, skilling locations, dialogue, and several kinds of combat. A small but interconnected slice exposed format, rendering, simulation, and content-boundary problems early, before those problems were repeated across the entire world.
                </p>
            </PaperLead>

            <PaperMetrics
                metrics={[
                    ["25", "loaded regions"],
                    ["102,400", "tiles per plane"],
                    ["79", "animated NPC types"],
                    ["50", "encounter specs"],
                ]}
            />

            <ScreenshotPlaceholder>
                a wide Varrock view showing terrain, buildings, the player, animated NPCs, and the boundary of the currently loaded regions
            </ScreenshotPlaceholder>

            <PaperSection title="1. Scope and engineering goals">
                <p className={bodyCopy}>
                    The project has two related goals. The first is interactive: load recognizable OSRS terrain, objects, NPCs, animations, and rules into a desktop viewer. The second is computational: run the same rules without graphics for deterministic tests, benchmarks, encounter development, and eventually reinforcement-learning workloads. A feature that works only because the viewer updates hidden state does not satisfy the second goal.
                </p>
                <p className={bodyCopy}>
                    RuneC is not a complete reimplementation of the live game. It is an engine in active development with a vertical slice and a large prepared data surface. Some systems are executable end to end, others have loaders and state structures but incomplete actions, and some are still specifications. The write-up separates those categories rather than presenting the number of exported definitions as the number of finished mechanics.
                </p>
                <PaperCallout>
                    RuneC is independently developed for technical study. It consumes locally prepared reference data and has no connection to the live game service, account protocol, or game servers.
                </PaperCallout>
            </PaperSection>

            <PaperSection title="2. Architecture">
                <p className={bodyCopy}>
                    Simulation, game-specific content, rendering, and data preparation have explicit boundaries. This is the main architectural decision in RuneC.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {[
                        ["rc-core", "Rendering-free C state and rules for ticks, collision, pathfinding, NPCs, combat, prayer, skills, events, and deterministic random behavior."],
                        ["rc-content", "OSRS-specific encounter scripts, quest state machines, and regional behavior. Generic engine code does not name a boss or quest."],
                        ["rc-viewer", "Raylib frontend for asset loading, camera and input, debug overlays, animation, and interpolation between simulation ticks."],
                        ["tools + data", "Python exporters convert cache and reference sources into validated, versioned binary inputs for the C runtime."],
                    ].map(([name, description]) => (
                        <div key={name} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                            <h3 className="font-mono text-sm text-white/85">{name}</h3>
                            <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                        </div>
                    ))}
                </div>
                <p className={bodyCopy}>
                    The viewer submits input and reads world state. It can interpolate positions at 60 frames per second, but only a simulation tick may decide that a character moved, an attack landed, a prayer drained, or an NPC died. Tests and headless tools call the same public core API. This makes the graphical client an observer of the engine rather than a second engine.
                </p>
            </PaperSection>

            <PaperSection title="3. One deterministic world state">
                <p className={bodyCopy}>
                    Mutable simulation state lives in one top-level <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">RcWorld</code>. It owns the player, fixed-capacity NPC and ground-item arrays, loaded regions, tick number, random state, enabled-subsystem mask, event bus, and current encounter. Per-world randomness means a seed and action stream define a reproducible run.
                </p>
                <p className={bodyCopy}>
                    The structure currently occupies 2,414,032 bytes, about 2.30 MiB, before immutable assets shared by multiple worlds. Inline arrays avoid allocation during a tick and make snapshots straightforward. The cost is that a mostly empty world reserves full capacities. This is acceptable for one viewer and convenient for tests, but it is too large for thousands of parallel reinforcement-learning environments. A future layout should separate hot mutable state from cold map and definition data and allocate capacities appropriate to a workload.
                </p>
                <PaperSubsection title="Tick order is a public contract">
                    <p className={bodyCopy}>
                        Each tick follows a fixed order: clear or accept input, plan routes, advance NPC movement, run NPC attacks, apply encounter mechanics, process player actions, resolve delayed hits, drain prayer, restore stats, handle deaths and respawns, then increment the clock. Delayed combat depends on this ordering. A queued hit must retain the protection-prayer snapshot and attack properties used when it was launched rather than reading whichever prayer happens to be active when damage appears.
                    </p>
                </PaperSubsection>
                <SyntaxCodeBlock code={tickDispatcherCode} language="c" filename="rc-core/tick.c" />
                <p className={bodyCopy}>
                    The excerpt removes repeated loops and cleanup details but keeps the actual phase boundaries. Those boundaries are documented and tested because changing them can alter combat even when every individual formula remains the same.
                </p>
            </PaperSection>

            <PaperSection title="4. A configurable core">
                <p className={bodyCopy}>
                    Not every workload needs the complete game. A collision test needs regions and pathfinding. A skilling experiment needs inventory, equipment, and recipes. A boss environment needs combat, prayer, consumables, and encounters. The full viewer will eventually enable all systems.
                </p>
                <SyntaxCodeBlock code={configCode} language="c" filename="example/combat_world.c" />
                <p className={bodyCopy}>
                    Configuration is consumed during world creation. The runtime stores twelve optional systems in a bitmask. The dispatcher uses direct bitwise checks rather than a dynamic plugin loader or virtual calls. Each enabled system can also supply an explicit asset path, making tests independent of the viewer&apos;s working directory and allowing a small fixture to replace the full data set.
                </p>
                <PaperSubsection title="Presets and dependencies">
                    <p className={bodyCopy}>
                        Four presets cover full game, combat only, skilling only, and base only. A preset is an ordinary C value, so a caller can override the seed or any data path before creating the world. System dependencies are resolved at initialization. This avoids an invalid world in which, for example, consumable actions exist without inventory state.
                    </p>
                </PaperSubsection>
            </PaperSection>

            <PaperSection title="5. Building the offline data pipeline">
                <p className={bodyCopy}>
                    The renderer and simulation need terrain, objects, collision flags, models, animations, NPC definitions, items, drops, quests, dialogue, shops, recipes, spells, varbits, and encounter data. Decoding all source formats inside the game would add startup cost, duplicate validation, and couple a hot C runtime to several changing external schemas.
                </p>
                <p className={bodyCopy}>
                    RuneC performs expensive and irregular work offline. Python tools read the b237 cache and structured reference sources, normalize identifiers, validate relationships, and write compact binary files. C loaders check headers and counts, then populate fixed runtime structures. Once the export is complete, a simulation does not require Python, a wiki connection, JSON parsing, or cache decoding.
                </p>
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 font-mono text-xs leading-7 text-white/50 sm:text-sm">
                    OSRS cache + reference data → Python decode and validation → versioned binaries → C loaders → simulation and viewer
                </div>
                <PaperTable>
                    <table className="w-full min-w-[660px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Exported domain</th>
                                <th className="px-5 py-4 font-medium">Records</th>
                                <th className="px-5 py-4 font-medium">Runtime use</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/55">
                            <tr><td className="px-5 py-4">Items</td><td className="px-5 py-4 font-mono">13,020</td><td className="px-5 py-4">Inventory, equipment, consumables, and drops.</td></tr>
                            <tr><td className="px-5 py-4">Varbits</td><td className="px-5 py-4 font-mono">2,871</td><td className="px-5 py-4">Compact quest and world-state fields.</td></tr>
                            <tr><td className="px-5 py-4">Shops</td><td className="px-5 py-4 font-mono">597</td><td className="px-5 py-4">Stock, pricing, and regional interaction data.</td></tr>
                            <tr><td className="px-5 py-4">Recipes</td><td className="px-5 py-4 font-mono">3,413</td><td className="px-5 py-4">Skilling inputs, products, levels, and experience.</td></tr>
                            <tr><td className="px-5 py-4">Spells</td><td className="px-5 py-4 font-mono">201</td><td className="px-5 py-4">Combat requirements, runes, effects, and timing.</td></tr>
                            <tr><td className="px-5 py-4">NPC drop tables</td><td className="px-5 py-4 font-mono">858</td><td className="px-5 py-4">Weighted primary and secondary rewards.</td></tr>
                            <tr><td className="px-5 py-4">Dialogue nodes</td><td className="px-5 py-4 font-mono">155,000+</td><td className="px-5 py-4">Branching conversation content and conditions.</td></tr>
                        </tbody>
                    </table>
                </PaperTable>
                <PaperCallout tone="warning">
                    These counts describe prepared data, not completed gameplay. Loading 597 shops does not mean every buying, selling, restock, and quest interaction is implemented. The data pipeline creates coverage; subsystem code turns that coverage into behavior.
                </PaperCallout>
            </PaperSection>

            <PaperSection title="6. Collision, pathfinding, and line of sight">
                <p className={bodyCopy}>
                    Twenty-five 64-by-64 regions provide 102,400 tiles on each loaded plane. Each tile carries directional movement and projectile flags exported from the cache. Eight-way movement checks the destination flag. A diagonal also checks the two adjacent cardinal edges so an entity cannot cut through the corner where two blocked walls meet.
                </p>
                <SyntaxCodeBlock code={collisionCode} language="c" filename="rc-core/pathfinding.c" />
                <p className={bodyCopy}>
                    The route finder uses breadth-first search in a bounded area around the start and can select a nearby alternative when the exact target is unreachable. Projectile line of sight walks the grid separately from movement because a tile can block walking, projectiles, both, or neither. Treating one flag as the other would make safe spots and ranged combat incorrect even if player navigation looked plausible.
                </p>
                <ScreenshotPlaceholder>
                    a debug overlay showing directional collision flags, an eight-way BFS route around Varrock walls, and a blocked projectile ray
                </ScreenshotPlaceholder>
                <PaperCallout tone="warning">
                    The current low-level flag lookup returns an open tile when a region is missing. That is useful during incomplete map development but unsafe for strict simulation: a bad asset path can silently remove walls. Benchmark and training entry points should fail startup if their required collision regions are absent.
                </PaperCallout>
            </PaperSection>

            <PaperSection title="7. The bridge and visual-level problem">
                <p className={bodyCopy}>
                    Multi-level map data produced one of the clearest failed approaches. Exporting only plane zero removed roofs and upstairs objects, which was desirable for a ground-level viewer, but also removed bridges stored on plane one and displayed visually below. Including most plane-one objects restored bridges and introduced unrelated upper-floor geometry.
                </p>
                <PaperTable>
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Attempt</th>
                                <th className="px-5 py-4 font-medium">Exported objects</th>
                                <th className="px-5 py-4 font-medium">Observed result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/55">
                            <tr><td className="px-5 py-4">Plane 0 only</td><td className="px-5 py-4 font-mono">62,196</td><td className="px-5 py-4">Clean ground floor, but bridges disappeared.</td></tr>
                            <tr><td className="px-5 py-4">Plane 0 plus non-roof plane 1</td><td className="px-5 py-4 font-mono">69,554</td><td className="px-5 py-4">Bridges returned with upper-floor clutter.</td></tr>
                            <tr><td className="px-5 py-4">LINK_BELOW visual resolution</td><td className="px-5 py-4 font-mono">61,387</td><td className="px-5 py-4">Bridges used the correct height while unrelated upper levels stayed hidden.</td></tr>
                        </tbody>
                    </table>
                </PaperTable>
                <p className={bodyCopy}>
                    The working solution follows the cache&apos;s visual-level rule instead of guessing from object types. A tile on the level above can carry the <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">LINK_BELOW</code> bit, meaning its geometry is rendered on the lower visual level.
                </p>
                <SyntaxCodeBlock code={bridgeCode} language="python" filename="tools/export_objects_bridge.py" />
                <p className={bodyCopy}>
                    A parser bug was hidden underneath the level heuristic. Terrain opcodes had been read as one byte even though the format stored unsigned two-byte values. The faulty decoder found between zero and two LINK_BELOW tiles depending on input. Reading the field correctly found 1,128. The lesson was to validate intermediate format facts—not just whether the final frame looked approximately right.
                </p>
                <ScreenshotPlaceholder>
                    side-by-side bridge exports from the plane-zero, broad plane-one, and LINK_BELOW implementations
                </ScreenshotPlaceholder>
            </PaperSection>

            <PaperSection title="8. Rendering a tick-based world at 60 FPS">
                <p className={bodyCopy}>
                    The simulation advances every 600 milliseconds while the viewer draws much more frequently. The renderer stores previous and current transforms and interpolates between them, so NPCs appear to walk continuously without changing the authoritative tick. Animation state is selected from exported skeleton and sequence data; terrain and static objects are batched to avoid issuing one draw call per tile or object.
                </p>
                <p className={bodyCopy}>
                    The current slice includes animation mappings for 79 NPC types. That number reflects NPCs with resolved and viewable animation data, not the total definitions available. Asset identifiers can refer to missing models, incompatible skeleton groups, or sequences that require additional interpretation. The pipeline records and reports those gaps instead of generating an arbitrary replacement silently.
                </p>
                <PaperSubsection title="Texture atlas limitation">
                    <p className={bodyCopy}>
                        Packing terrain textures into an atlas reduced texture changes but changed UV semantics. Some OSRS materials repeat across a face; atlas coordinates cannot repeat without sampling neighboring entries. Clamping avoids bleeding but stretches the texture. A texture array, where each material has its own repeatable layer, is the likely replacement. This is a case where a common batching technique conflicts with the source renderer&apos;s material behavior.
                    </p>
                </PaperSubsection>
            </PaperSection>

            <PaperSection title="9. Generic events and game-specific encounters">
                <p className={bodyCopy}>
                    Boss mechanics should not accumulate as names and special cases inside the main tick. The core publishes typed events such as NPC spawn, NPC death, and player damage. The encounter subsystem subscribes once during initialization and uses those events to update active encounter state without adding another scan to every tick.
                </p>
                <SyntaxCodeBlock code={eventCode} language="c" filename="rc-core/events.c + encounter.c" />
                <p className={bodyCopy}>
                    The event bus is fixed-capacity and initialized with the world, preserving deterministic subscription order and avoiding allocation during dispatch. A re-entry guard prevents a handler from recursively firing the same event with unclear ordering. Encounter definitions provide arena, spawn, phase, and parameter data. Shared C primitives implement reusable mechanics; boss-specific content files are the intended home for behavior that cannot be expressed by those primitives.
                </p>
                <p className={bodyCopy}>
                    Fifty encounter specifications have been prepared, but the executable content layer currently covers a pilot set of primitives and scripts. That distinction matters: the specification effort proves the schema against varied mechanics, while runtime completion still requires implementing and validating those mechanics one family at a time.
                </p>
            </PaperSection>

            <PaperSection title="10. Determinism and validation">
                <p className={bodyCopy}>
                    Two worlds created with the same configuration and seed must reach the same state after the same actions. This is checked below the viewer. Tests exercise direct structures and public APIs, compare state fields, and cover delayed events across multiple ticks.
                </p>
                <StatusList>
                    <StatusItem>Directional collision and eight-way BFS pathfinding are checked against controlled map flags.</StatusItem>
                    <StatusItem>Combat covers accuracy, maximum-hit formulas, queued damage, deaths, and same-seed replay.</StatusItem>
                    <StatusItem>Pending hits retain the protection-prayer state from their queue tick rather than the later resolution tick.</StatusItem>
                    <StatusItem>Encounter binary loading, event dispatch, mechanic primitives, and end-to-end encounter transitions have independent executables.</StatusItem>
                    <StatusItem>Nine current test executables pass: base, collision, combat, combat end-to-end, determinism, encounter, encounter binary, encounter primitives, and pathfinding.</StatusItem>
                </StatusList>
                <p className={bodyCopy}>
                    Visual inspection remains useful for asset transforms and map interpretation, but it is not the only oracle. The bridge bug, for example, should fail a count or known-coordinate assertion even before a screenshot is compared. The next pipeline step is to turn more audited coordinates, object counts, and binary headers into automated fixtures.
                </p>
                <ScreenshotPlaceholder>
                    the test runner showing all nine executables passing, alongside a deterministic replay state comparison
                </ScreenshotPlaceholder>
            </PaperSection>

            <PaperSection title="11. Measuring dispatcher overhead">
                <p className={bodyCopy}>
                    I measured the cost of optional-system gates with an empty-world microbenchmark. Each case ran 20 million release-build ticks on one Intel Core i7-14700F thread using GCC 13.3. The table reports the median of three runs.
                </p>
                <PaperTable>
                    <table className="w-full min-w-[660px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Configuration</th>
                                <th className="px-5 py-4 font-medium">Optional systems</th>
                                <th className="px-5 py-4 font-medium">Million ticks/s</th>
                                <th className="px-5 py-4 font-medium">Nanoseconds/tick</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-white/55">
                            <tr><td className="px-5 py-4 font-sans">Base only</td><td className="px-5 py-4">0</td><td className="px-5 py-4">650</td><td className="px-5 py-4">1.54</td></tr>
                            <tr><td className="px-5 py-4 font-sans">Skilling only</td><td className="px-5 py-4">3</td><td className="px-5 py-4">663</td><td className="px-5 py-4">1.51</td></tr>
                            <tr><td className="px-5 py-4 font-sans">Combat only</td><td className="px-5 py-4">6</td><td className="px-5 py-4">94</td><td className="px-5 py-4">10.66</td></tr>
                            <tr><td className="px-5 py-4 font-sans">Full game</td><td className="px-5 py-4">12</td><td className="px-5 py-4">92</td><td className="px-5 py-4">10.91</td></tr>
                        </tbody>
                    </table>
                </PaperTable>
                <PaperCallout tone="warning">
                    This benchmark isolates dispatcher and idle-system overhead. It has no active NPC workload, route search, rendering, or policy observation generation. It is not a full-game throughput claim. Combat-only and full-game are close partly because several full-game tick functions are still incomplete. The narrow conclusion is that disabling combat and encounters removes their idle cost, while lightweight bitmask gates fall within run-to-run noise.
                </PaperCallout>
                <p className={bodyCopy}>
                    The next benchmark should define realistic scenarios: a populated Varrock route, sustained combat with queued hits, an encounter with mechanics, and multiple active worlds. Those measurements can guide structure splitting and cache work; an empty dispatcher benchmark cannot.
                </p>
            </PaperSection>

            <PaperSection title="12. What worked, what failed, and what comes next">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200/10 bg-emerald-200/[0.025] p-5">
                        <h3 className="text-sm font-medium text-white/80">Working foundations</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/50">
                            <li>The core/viewer boundary supports visual play and headless tests without duplicating rules.</li>
                            <li>Offline binary exports keep irregular source parsing out of the runtime.</li>
                            <li>Seeded world state and fixed tick order make regressions reproducible.</li>
                            <li>Directional collision, pathfinding, delayed combat, prayer, events, and pilot encounters have executable tests.</li>
                            <li>Visual-level resolution fixed bridge placement without hardcoding individual objects.</li>
                        </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200/10 bg-amber-200/[0.025] p-5">
                        <h3 className="text-sm font-medium text-white/80">Incomplete or unsuitable approaches</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/50">
                            <li>Broad plane-one inclusion was not a reliable substitute for the source visual-level rule.</li>
                            <li>The current texture atlas cannot reproduce all repeating materials correctly.</li>
                            <li>Several public input functions, death/respawn behaviors, and system loaders remain stubs.</li>
                            <li>Prepared encounter data is much broader than the mechanics currently executable.</li>
                            <li>Permissive missing-region collision and the 2.30 MiB world structure are poor defaults for large parallel runs.</li>
                        </ul>
                    </div>
                </div>
                <p className={bodyCopy}>
                    The next technical priorities are to complete the public action path, close silent asset fallbacks, finish engine-to-content event wiring, replace the texture atlas, and divide world memory into hot mutable and shared immutable regions. Realistic benchmarks should then measure active NPCs, pathfinding, combat, observation generation, and multi-world scaling. With those contracts stable, expanding beyond Varrock becomes data and content work rather than a rewrite of the viewer.
                </p>
            </PaperSection>
        </article>
    );
}
