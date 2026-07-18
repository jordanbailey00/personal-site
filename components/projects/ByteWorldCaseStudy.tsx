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

const stateCode = `@dataclass
class GameState:
    """Single source of truth for game runtime."""

    player: Player
    current_location_id: str = "old_shack"
    quest_stage: str = "awakening"
    flags: set[str] = field(default_factory=set)
    active_encounter: Optional[Encounter] = None
    discovered_locations: set[str] = field(default_factory=set)
    kill_counts_by_location: Dict[str, Dict[str, int]] = field(default_factory=dict)
    turn_count: int = 0
    game_over: bool = False
    victory: bool = False
    rng: random.Random = field(default_factory=random.Random)`;

const questCode = `def _determine_stage(state: GameState) -> str:
    if "met_old_man" not in state.flags:
        return "awakening"
    if "frog_defeated" not in state.flags:
        return "swamp_secret"
    if "dragon_defeated" not in state.flags:
        return "mountain_flame"
    if not ({"goblin_army_defeated", "goblin_pass_granted"} & state.flags):
        return "castle_road"
    if "makor_defeated" not in state.flags:
        return "black_hall"
    if "onyx_witch_defeated" not in state.flags:
        return "witch_bane"
    if "elle_cleansed" not in state.flags:
        return "rescue_elle"
    return "homecoming"`;

const combatCode = `def _player_attack_damage(state, enemy, multiplier=1.0):
    stats = get_effective_stats(state.player)
    attack = int(stats["attack"] * multiplier)
    damage = attack + state.rng.randint(-2, 3) - int(enemy.get("defense", 0) / 2)
    return max(1, damage)

def _enemy_attack_damage(state, enemy, encounter, intent):
    stats = get_effective_stats(state.player)
    base = int(intent.get("base_damage", enemy.get("attack", 1)))
    damage = max(1, base + state.rng.randint(-3, 3) - int(stats["defense"] / 3))

    if encounter.player_defending:
        damage = max(1, int(damage * intent.get("defend_multiplier", 0.5)))

    return damage`;

const browserLoaderCode = `const PYODIDE_JS_URL =
  "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js";

async function loadGameSources() {
  for (const sourcePath of SOURCE_FILES) {
    const source = await fetchSource(sourcePath);
    ensureParentDirectory(sourcePath);
    pyodide.FS.writeFile(sourcePath, source, { encoding: "utf8" });
  }
}

async function startRuntime() {
  await loadPyodideScript();
  pyodide = await window.loadPyodide();
  await loadGameSources();
  await bootstrapGameApi();
}`;

const safeAnsiCode = `function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ansiToHtml(text) {
  const clean = String(text || "")
    .replace(CONTROL_PATTERN, "")
    .replaceAll("\\r", "");

  // Each text segment is escaped before an approved ANSI color
  // is translated to a CSS class.
  return renderApprovedColorRuns(clean, ANSI_CLASS_BY_CODE, escapeHtml);
}`;

const progressionCode = `def xp_to_next_level(level: int) -> int:
    return 40 + max(0, level - 1) * 30

while player.xp >= xp_to_next_level(player.level):
    player.xp -= xp_to_next_level(player.level)
    player.level += 1
    player.base_max_hp += 6
    player.base_attack += 1
    player.base_defense += 1
    player.hp = get_effective_stats(player)["max_hp"]`;

export default function ByteWorldCaseStudy() {
    return (
        <article className="space-y-16">
            <PaperLead>
                <p>
                    Byte World is a command-driven fantasy role-playing game written in Python. The player explores a connected world, talks to characters, chooses equipment, develops combat stats, and completes an eight-stage quest ending with King Makor and the Onyx Witch. The game runs in a normal terminal and in a web browser. Both versions execute the same Python rules rather than maintaining separate implementations.
                </p>
                <p>
                    I started with a text interface because it makes every game rule explicit. A command has to be parsed, validated against the current state, applied to one system, and described clearly enough that the player knows what changed. As the project grew, the main engineering challenge became preserving that simple model while adding a browser dashboard, persistent saves, art, contextual actions, procedural enemy variants, boss-specific mechanics, and a static deployment that requires no backend.
                </p>
            </PaperLead>

            <PaperMetrics
                metrics={[
                    ["13", "world locations"],
                    ["146", "runtime enemy types"],
                    ["23", "items"],
                    ["8", "quest stages"],
                ]}
            />

            <ScreenshotPlaceholder>
                the current browser dashboard showing scene art, terminal output, player status, suggested actions, inventory, location details, and kill history
            </ScreenshotPlaceholder>

            <PaperSection title="1. The design goal">
                <p className={bodyCopy}>
                    Byte World is intentionally text-first, but it is not a parser guessing game. Every prompt exposes actions that are valid in the current context. Movement commands show unlocked exits. Combat replaces exploration actions with attacks, defense, skills, items, and escape. Important nouns use consistent colors. The map and quest commands explain where the player is and what progression currently requires.
                </p>
                <p className={bodyCopy}>
                    That leads to three design rules. First, the engine owns state and rules; an interface only submits commands and displays a response. Second, progression should be derived from completed facts instead of manually incremented counters. Third, failure should cost something without erasing the entire playthrough. The player wakes in the opening shack at half health after defeat, while certain story encounters can add a small permanent penalty.
                </p>
                <PaperCallout>
                    The project name includes “AI,” but the current game is a deterministic rules engine with seeded random combat. It does not send player commands to a language model or require an external AI service.
                </PaperCallout>
            </PaperSection>

            <PaperSection title="2. A single engine for terminal and browser">
                <p className={bodyCopy}>
                    The Python package is divided into state, command parsing, engine dispatch, presentation helpers, content, and four rule systems. Exploration controls movement and encounters. Combat owns turn resolution and bosses. Loot handles items, equipment, rewards, and consumables. Quest logic converts completed flags into the current objective.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {[
                        ["game/", "State containers, parser, dispatcher, command hints, and shared text presentation."],
                        ["systems/", "Exploration, combat, loot, progression, and quest transitions."],
                        ["content/", "Locations, exits, NPCs, enemy templates, items, quest copy, and artwork."],
                        ["static/", "Pyodide bootstrap, browser state bridge, ANSI rendering, dashboard controls, and responsive layout."],
                    ].map(([name, description]) => (
                        <div key={name} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                            <h3 className="font-mono text-sm text-white/85">{name}</h3>
                            <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
                        </div>
                    ))}
                </div>
                <p className={bodyCopy}>
                    The local entry point creates an engine and reads from standard input. The browser creates the same engine inside Pyodide and calls a small set of bridge functions. Commands such as <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">move east</code>, <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">skill focus strike</code>, and <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">equip all</code> therefore reach the same dispatcher in both modes.
                </p>
            </PaperSection>

            <PaperSection title="3. State as the source of truth">
                <p className={bodyCopy}>
                    A <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">GameState</code> object contains the mutable run. The player has base statistics, inventory, equipment, skills, cooldowns, titles, and temporary bonuses. The outer state records location, progression flags, the current encounter, discoveries, location-specific kill counts, turn count, completion status, and its own random generator.
                </p>
                <SyntaxCodeBlock code={stateCode} language="python" filename="game/state.py" />
                <p className={bodyCopy}>
                    Passing state explicitly keeps systems testable and avoids scattering values across the UI. It also enables saving. A snapshot can serialize the fields that define the run, including the random generator state; restoring it reproduces not only inventory and location but the future random sequence from that point.
                </p>
                <PaperSubsection title="Derived statistics">
                    <p className={bodyCopy}>
                        Base attack, defense, and maximum health are permanent progression. Effective statistics are calculated by adding the bonuses on all five equipment slots and any temporary encounter effects. Health is clamped whenever equipment changes so removing a health item cannot leave the player above the new maximum. This one calculation is used by combat, status output, healing, level-up, defeat, and the browser panel.
                    </p>
                </PaperSubsection>
            </PaperSection>

            <PaperSection title="4. Commands without hidden syntax">
                <p className={bodyCopy}>
                    The command layer normalizes case and whitespace, supports directional abbreviations, and allows item or character names to be matched by readable text. Parsing produces an operation that the engine validates against the state. A movement command is rejected during combat. A skill on cooldown explains how long remains. An equipment query that matches nothing reports the missing item instead of raising an exception.
                </p>
                <p className={bodyCopy}>
                    Contextual action hints use the same state to build the menu. Out of combat, the player sees legal exits, nearby interactions, inventory actions, training, status, map, and quest help. During a boss negotiation, the panel can narrow to joke, bribe, or fight. Once regular combat begins, it switches to attacks, defense, available skills, usable items, and escape.
                </p>
                <ScreenshotPlaceholder>
                    side-by-side terminal sessions showing exploration hints and the reduced set of actions during a boss encounter
                </ScreenshotPlaceholder>
            </PaperSection>

            <PaperSection title="5. World graph and quest progression">
                <p className={bodyCopy}>
                    The authored world contains 13 locations connected by directional exits. Exits can require a flag, allowing a bridge, gate, route, or final area to remain locked until the relevant story event. The map command runs a breadth-first search over currently traversable connections and marks a recommended first direction toward the active objective. This gives useful guidance without moving the player automatically.
                </p>
                <p className={bodyCopy}>
                    Quest stage is not advanced by writing “stage plus one.” It is recalculated from facts such as meeting the Wise Old Man, defeating the frog and dragon, getting past the goblin army, defeating Makor and the Witch, and cleansing Elle.
                </p>
                <SyntaxCodeBlock code={questCode} language="python" filename="systems/quest.py" />
                <p className={bodyCopy}>
                    Derived progression prevents contradictory saves. If a snapshot contains the Makor-defeated flag, the current objective can be reconstructed even if a stale stage label is missing. Alternative goblin outcomes also fit naturally: defeating the army and negotiating passage are different facts that both unlock the road, while only one grants the riddle needed to remove the Witch&apos;s barrier.
                </p>
            </PaperSection>

            <PaperSection title="6. Turn-based combat">
                <p className={bodyCopy}>
                    Combat uses a visible intent cycle. The player reads what the enemy is preparing, then chooses an attack, defend action, skill, item, or escape attempt. If the action consumes a turn and the enemy survives, the enemy acts. Cooldowns decrease after the enemy turn. This ordering makes defense tactical: it modifies the next telegraphed hit rather than adding a permanent armor state.
                </p>
                <SyntaxCodeBlock code={combatCode} language="python" filename="systems/combat.py" />
                <p className={bodyCopy}>
                    The formulas are deliberately compact. Player attack and gear establish the center of the damage range; the enemy&apos;s defense removes half its value; a small seeded random term creates variation; damage has a minimum of one. Enemy damage uses one-third of player defense and can be multiplied by an intent-specific defend value. Because the equations are short enough to inspect, balance changes have predictable effects.
                </p>
                <PaperSubsection title="Skills and decisions">
                    <p className={bodyCopy}>
                        Focus Strike deals approximately 1.8 times normal attack on a two-turn cooldown. Guard Stance combines defense with six health on a three-turn cooldown. Second Wind restores 16 health on a four-turn cooldown. These create timing choices without adding a large ability tree: spend the heavy attack now, preserve recovery for a harder intent, or defend when the incoming multiplier is favorable.
                    </p>
                </PaperSubsection>
                <PaperSubsection title="Escape and defeat">
                    <p className={bodyCopy}>
                        Escape succeeds 65% of the time against normal enemies, 28% against bosses, and 22% against the Goblin Army. A failed attempt gives the enemy a turn, preventing free retries. Defeat returns the player to the Old Shack with 50% of effective maximum health. A Goblin Army loss has a 50% chance to reduce one base statistic by one, which gives that encounter a persistent risk while keeping the playthrough recoverable.
                    </p>
                </PaperSubsection>
            </PaperSection>

            <PaperSection title="7. Boss mechanics as state changes">
                <p className={bodyCopy}>
                    Six bosses provide fixed points in the progression: the Giant Frog at 85 health, the Dragon at 130, an optional Ogre at 150, the Goblin Army at 165, King Makor at 190, and the Onyx Witch at 230. They use the ordinary combat loop plus small, explicit state transitions rather than an unrelated scripting engine.
                </p>
                <StatusList>
                    <StatusItem>The Goblin Army begins as a negotiation. A joke grants passage, a bribe spends all current gold, and fighting can award the riddle.</StatusItem>
                    <StatusItem>King Makor checks for the mysterious ring when combat starts; the ring temporarily adds four attack and two defense, then clears when the encounter ends.</StatusItem>
                    <StatusItem>The Onyx Witch begins behind a barrier. The Goblin Riddle removes it; attacking while the barrier remains cannot progress normally.</StatusItem>
                    <StatusItem>The Witch&apos;s active curse deals four additional damage after each enemy turn, making a slow defensive loop unsustainable.</StatusItem>
                    <StatusItem>Boss victories set progression flags, award titles and loot, and recover half of missing health before exploration resumes.</StatusItem>
                </StatusList>
                <ScreenshotPlaceholder>
                    the Onyx Witch encounter with barrier state, current intent, health bars, cooldowns, and the available riddle action visible
                </ScreenshotPlaceholder>
            </PaperSection>

            <PaperSection title="8. Progression, equipment, and loot">
                <p className={bodyCopy}>
                    Experience thresholds grow linearly: the next level costs 40 XP at level one, then 30 more for each later level. A level adds six base maximum health, one attack, and one defense, and restores health. Separate skill points let the player specialize instead of relying only on automatic level gains.
                </p>
                <SyntaxCodeBlock code={progressionCode} language="python" filename="game/state.py" />
                <p className={bodyCopy}>
                    The inventory defines 23 items across consumables, weapons, armor, shields, accessories, auras, keys, and quest objects. Five equipment slots contribute to effective statistics. The <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">equip all</code> command scores owned gear by attack, defense, and one-third of maximum-health bonus, then applies deterministic tie breakers. It is a convenience function, not a separate set of combat rules.
                </p>
                <p className={bodyCopy}>
                    Every victory awards a healing supply stack of five to ten. Normal enemies have a 45% chance of an additional drop and bosses 70%. Interesting and rare drop chances vary with area rather than using one global table. Rare boons award ten, twenty, or thirty skill points. This produces a readable farm-and-upgrade loop while allowing late locations to have meaningfully different reward profiles.
                </p>
            </PaperSection>

            <PaperSection title="9. Content scale and procedural variation">
                <p className={bodyCopy}>
                    Content is stored in Python dictionaries so locations, exits, encounters, item bonuses, dialogue, and quest copy can be edited without changing the engine dispatcher. There are 13 authored base enemy definitions: seven normal templates and six bosses. At startup, seven farm locations derive 19 local variants apiece. Combined with the base forms, that produces 140 normal runtime enemy types plus six bosses, or 146 total.
                </p>
                <PaperTable>
                    <table className="w-full min-w-[660px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/40">
                            <tr>
                                <th className="px-5 py-4 font-medium">Layer</th>
                                <th className="px-5 py-4 font-medium">Count</th>
                                <th className="px-5 py-4 font-medium">Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/55">
                            <tr><td className="px-5 py-4">Locations</td><td className="px-5 py-4 font-mono">13</td><td className="px-5 py-4">World graph, story locks, NPCs, farming areas, and boss spaces.</td></tr>
                            <tr><td className="px-5 py-4">Base enemy definitions</td><td className="px-5 py-4 font-mono">13</td><td className="px-5 py-4">Seven normal archetypes and six hand-authored bosses.</td></tr>
                            <tr><td className="px-5 py-4">Generated normal variants</td><td className="px-5 py-4 font-mono">133</td><td className="px-5 py-4">Nineteen variants for each of seven farming locations.</td></tr>
                            <tr><td className="px-5 py-4">Runtime enemies</td><td className="px-5 py-4 font-mono">146</td><td className="px-5 py-4">The 140 normal forms plus six bosses.</td></tr>
                            <tr><td className="px-5 py-4">Items / quest stages</td><td className="px-5 py-4 font-mono">23 / 8</td><td className="px-5 py-4">Equipment and rewards supporting the complete story route.</td></tr>
                        </tbody>
                    </table>
                </PaperTable>
                <p className={bodyCopy}>
                    Generation avoids hand-copying nearly identical enemies while leaving bosses explicit. The tradeoff is schema safety: dictionary keys and types are validated by convention at runtime rather than by a formal content compiler. Typed content models or a validation pass would make a larger world safer to extend.
                </p>
            </PaperSection>

            <PaperSection title="10. Running Python in a static website">
                <p className={bodyCopy}>
                    The first web version used an application host. I replaced it with GitHub Pages and Pyodide so the site could be deployed as static files with no server process, database, API key, or account system. The browser downloads Pyodide 0.29.3, fetches 15 Python and content files, creates their directory structure in Pyodide&apos;s in-memory filesystem, imports the engine, and exposes functions for initial render, command processing, reset, save, and load.
                </p>
                <SyntaxCodeBlock code={browserLoaderCode} language="javascript" filename="static/app.js" />
                <p className={bodyCopy}>
                    GitHub Actions publishes the repository to Pages. After the initial runtime download, command processing is local to the browser. No gameplay command leaves the device. This makes hosting simple and keeps the Python code authoritative, but the first load is heavier than a JavaScript-only application and depends on the Pyodide CDN being reachable.
                </p>
                <PaperCallout tone="warning">
                    The browser bridge is currently 2,078 lines because it includes runtime loading, the Python bootstrap, serialization, presentation conversion, panel updates, and controls. It works, but it is the largest maintenance concentration in the project. Splitting the bridge into modules is a clear next refactor.
                </PaperCallout>
            </PaperSection>

            <PaperSection title="11. Rendering terminal output safely">
                <p className={bodyCopy}>
                    The Python UI uses ANSI escape sequences so a local terminal can color NPCs, bosses, items, health, skills, and quest objects. A browser cannot display those sequences directly. The web layer removes unsupported control sequences, escapes text as HTML, and translates only an approved map of color codes into CSS classes.
                </p>
                <SyntaxCodeBlock code={safeAnsiCode} language="javascript" filename="static/app.js" />
                <p className={bodyCopy}>
                    Escaping happens before inserting colored spans. This preserves shared Python output without treating game text as trusted markup. The browser also renders structured data outside the terminal: status, art, actions, inventory, location, and kill history each have their own panel, and combat adds a visual tint so a state change is visible without rereading the transcript.
                </p>
            </PaperSection>

            <PaperSection title="12. Browser persistence">
                <p className={bodyCopy}>
                    The current browser version saves to local storage under a versioned key. A snapshot includes player attributes, inventory, equipment, skills, cooldowns, titles, flags, location, active encounter, discoveries, kills, turn count, completion status, and encoded random-generator state. Restore code validates types, known identifiers, numeric bounds, equipment slots, and encounter fields before replacing the live state.
                </p>
                <p className={bodyCopy}>
                    Saving RNG state is easy to miss. Without it, loading preserves the visible character but changes the sequence of future hits and loot. Including it makes a save a continuation of the same run rather than a new random branch with copied inventory. The format is currently version one; future schema changes will need explicit migrations rather than increasingly permissive restore logic.
                </p>
            </PaperSection>

            <PaperSection title="13. What I tried and changed">
                <p className={bodyCopy}>
                    The repository history shows the project moving through several interface and deployment models. Each change addressed a concrete limitation rather than replacing the engine.
                </p>
                <StatusList>
                    <StatusItem>The hosted Python service was removed in favor of static Pages plus Pyodide, eliminating a backend and runtime credentials.</StatusItem>
                    <StatusItem>A terminal-shaped single panel became a two-pane and then multi-panel dashboard because important state and valid actions were too easy to miss in a scrolling transcript.</StatusItem>
                    <StatusItem>Refresh originally discarded progress. Versioned local storage and validated state restoration made the static build usable across sessions.</StatusItem>
                    <StatusItem>Large ASCII art embedded inside the Python bootstrap produced escaping and parsing failures. File-based art and PNG assets reduced the amount of code that had to survive JavaScript-to-Python quoting.</StatusItem>
                    <StatusItem>Fixed enemy lists expanded into location-based variants to increase farming variety without duplicating the combat engine.</StatusItem>
                </StatusList>
                <p className={bodyCopy}>
                    Some documentation in the repository still describes the earlier no-save browser and the previous host. The current source is the authority for this write-up: it includes persistence and deploys the static game from the repository&apos;s GitHub Pages workflow.
                </p>
            </PaperSection>

            <PaperSection title="14. Quantitative scope and current limits">
                <p className={bodyCopy}>
                    In the audited revision, the Python engine and content plus browser HTML, CSS, and JavaScript total approximately 6,340 lines. The browser bridge accounts for 2,078 lines, CSS for 530, and the page shell for 165. The repository reached this state through 27 commits over the initial development period. Line count is not a quality metric, but it makes the implementation distribution visible: a substantial share now lives in adapting and presenting the shared engine in a browser.
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200/10 bg-emerald-200/[0.025] p-5">
                        <h3 className="text-sm font-medium text-white/80">What works</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/50">
                            <li>One Python rules engine supports local CLI and static browser play.</li>
                            <li>The main quest, six bosses, equipment, leveling, loot, death, hints, and persistent saves form a complete loop.</li>
                            <li>Flags and a world graph keep alternative quest outcomes and navigation explicit.</li>
                            <li>All browser computation is local after assets load; deployment needs no application server.</li>
                        </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200/10 bg-amber-200/[0.025] p-5">
                        <h3 className="text-sm font-medium text-white/80">What remains</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/50">
                            <li>The repository does not yet contain an automated regression suite for combat, quests, saves, or command parsing.</li>
                            <li>Content dictionaries need stronger schema validation as locations and items increase.</li>
                            <li>The monolithic browser bridge should be separated into runtime, persistence, rendering, and controls.</li>
                            <li>First-load size and CDN availability are costs of running CPython through Pyodide.</li>
                        </ul>
                    </div>
                </div>
                <p className={bodyCopy}>
                    The next work I would prioritize is a deterministic Python test suite built around seeded <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/75">GameState</code> fixtures. Quest route tests should cover both goblin outcomes; combat tests should assert intent, cooldown, barrier, defeat, and reward behavior; save tests should round-trip an active encounter and RNG state. With those contracts protected, the browser bridge can be modularized and the world can grow without turning every content edit into a manual full playthrough.
                </p>
            </PaperSection>
        </article>
    );
}
