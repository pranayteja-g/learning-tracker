import { useState }          from "react";
import { RadialProgress }    from "../ui/RadialProgress.jsx";
import { useXP, MILESTONE_BADGES, getLevel, getNextLevel } from "../../hooks/useXP.js";
import { getRoadmapStats, getTotalStats, getNextUp } from "../../utils/roadmap.js";
import { getPerformanceStats } from "../../utils/performance.js";
import { flatTopicNames } from "../../utils/topics.js";

function ScoreBar({ score }) {
  const c = score >= 70 ? "#52b788" : score >= 50 ? "#ee9b00" : "#e05252";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "#1e1e24", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: c, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: c, fontWeight: 700, minWidth: 30, textAlign: "right" }}>{score}%</span>
    </div>
  );
}

function TopicPill({ topic, rmLabel, rmColor, rmAccent, bestScore, proficiency = 0, passed, stars = 0 }) {
  const score = proficiency || bestScore;
  const scoreColor = score >= 70 ? "#52b788" : score >= 50 ? "#ee9b00" : "#e05252";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 10px", background: "#0f0f13", borderRadius: 7,
      border: `1px solid ${rmColor}22`, marginBottom: 5 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#ccc", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic}</div>
        <div style={{ fontSize: 10, color: rmAccent, marginTop: 1 }}>{rmLabel}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {stars > 0
          ? <span style={{ fontSize: 11, letterSpacing: -2 }}>{"⭐".repeat(stars)}</span>
          : passed && <span style={{ fontSize: 10, color: "#555" }}>○</span>}
        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor, marginLeft: 4 }}>{score}%</span>
      </div>
    </div>
  );
}


function Section({ title, defaultOpen = true, children, isMobile }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#16161b", borderRadius: 12, border: "1px solid #1e1e24",
      marginBottom: 12, overflow: "hidden", boxSizing: "border-box" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", fontFamily: "inherit" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#ccc" }}>{title}</span>
        <span style={{ fontSize: 14, color: "#444", transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
}

export function Dashboard({ roadmaps, progress, notes, resources, topicMeta,
  quizResults = {}, isMobile, onOpenRoadmap, onOpenNote }) {
  const { xpData } = useXP();
  const level      = getLevel(xpData?.xp || 0);
  const nextLevel  = getNextLevel(xpData?.xp || 0);
  const xp         = xpData?.xp || 0;
  const pct        = nextLevel ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100) : 100;

  const t        = getTotalStats(roadmaps, progress);
  const allNotes = Object.entries(notes).filter(([, v]) => v?.trim());
  const perf     = getPerformanceStats(roadmaps, quizResults);
  const hasQuiz  = perf.totalAttempted > 0;
  const totalTopicCount = Object.values(roadmaps)
    .reduce((n, rm) => n + Object.values(rm.sections).flatMap(ts => flatTopicNames(ts)).length, 0);

  const card = {
    background: "#16161b", border: "1px solid #2a2a35",
    borderRadius: 12, padding: "16px", marginBottom: 14,
  };
  const label = (text) => (
    <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase",
      letterSpacing: 1, marginBottom: 10 }}>{text}</div>
  );

  return (
    <div style={{ padding: isMobile ? "12px" : "28px", overflowY: "auto", overflowX: "hidden",
      maxHeight: isMobile ? "calc(100dvh - 56px)" : "calc(100vh - 88px)",
      paddingBottom: isMobile ? "90px" : "40px" }}>

      {/* ── Overall ── */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <RadialProgress pct={t.pct} color="#7b5ea7" size={72} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.pct}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
            Overall Progress
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
            {t.done} <span style={{ fontSize: 13, color: "#555", fontWeight: 400 }}>/ {t.total} topics</span>
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
            {Object.keys(roadmaps).length} roadmaps · {allNotes.length} notes
            {hasQuiz && ` · ${perf.totalPassed}/${perf.totalAttempted} quizzes passed`}
          </div>
        </div>
        {hasQuiz && (
          <div style={{ textAlign: "center", flexShrink: 0, padding: "8px 12px",
            background: "#0f0f13", borderRadius: 8, border: "1px solid #2a2a35" }}>
            <div style={{ fontSize: 22, fontWeight: 700,
              color: perf.avgScore >= 70 ? "#52b788" : perf.avgScore >= 50 ? "#ee9b00" : "#e05252" }}>
              {perf.avgScore}%
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>avg quiz</div>
          </div>
        )}
      </div>

      {/* ── Quiz performance ── */}
      {hasQuiz ? (
        <div style={card}>
          {label("🧠 Quiz Performance")}

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { l: "Tested",    v: perf.totalAttempted, sub: `of ${totalTopicCount} topics` },
              { l: "Passed",    v: perf.totalPassed,    sub: `${perf.totalAttempted ? Math.round((perf.totalPassed/perf.totalAttempted)*100) : 0}% pass rate` },
              { l: "Avg Score", v: `${perf.avgScore}%`, sub: perf.avgScore >= 70 ? "Good shape" : perf.avgScore >= 50 ? "Improving" : "Needs work" },
            ].map(({ l, v, sub }) => (
              <div key={l} style={{ background: "#0f0f13", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{v}</div>
                <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 1 }}>{l}</div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Strongest / Weakest */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            {perf.strongest.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "#52b788", textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 8 }}>💪 Strongest</div>
                {perf.strongest.slice(0, 5).map((t, i) => <TopicPill key={i} {...t} />)}
              </div>
            )}
            {perf.weakest.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "#e05252", textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 8 }}>📚 Needs Retry</div>
                {perf.weakest.slice(0, 5).map((t, i) => <TopicPill key={i} {...t} />)}
              </div>
            )}
          </div>

          {/* Recent activity */}
          {perf.recentActivity.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1e1e24" }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 8 }}>⏱️ Recent (7 days)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {perf.recentActivity.slice(0, 8).map((t, i) => (
                  <div key={i} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11,
                    background: t.passed ? "#52b78818" : "#ee9b0018",
                    border: `1px solid ${t.passed ? "#52b78844" : "#ee9b0044"}`,
                    color: t.passed ? "#52b788" : "#ee9b00" }}>
                    {t.topic} · {t.proficiency || t.bestScore}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...card, textAlign: "center", padding: "22px 16px", border: "1px dashed #2a2a35" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🧠</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>No quiz data yet</div>
          <div style={{ fontSize: 12, color: "#444" }}>
            Practice → Study → Quiz to track your performance here
          </div>
        </div>
      )}

      {/* ── Per-roadmap quiz breakdown ── */}
      {hasQuiz && Object.values(perf.byRoadmap).some(r => r.attempted > 0) && (
        <div style={card}>
          {label("📊 Quiz by Section")}
          {Object.entries(perf.byRoadmap).map(([rmId, rmStats]) => {
            if (!rmStats.attempted) return null;
            return (
              <div key={rmId} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{rmStats.label}</span>
                  <span style={{ fontSize: 11, color: rmStats.accent }}>
                    {rmStats.passed}/{rmStats.attempted} passed
                  </span>
                </div>
                {Object.entries(rmStats.sections).map(([sec, sd]) => {
                  if (!sd.attempted) return null;
                  return (
                    <div key={sec} style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                        fontSize: 11, color: "#555", marginBottom: 3 }}>
                        <span>{sec}</span>
                        <span>{sd.passed}/{sd.attempted} passed</span>
                      </div>
                      <ScoreBar score={sd.attempted ? Math.round((sd.passed/sd.attempted)*100) : 0} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Per-roadmap progress ── */}
      <div style={{ display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 12, marginBottom: 14 }}>
        {Object.values(roadmaps).map(val => {
          const s    = getRoadmapStats(val, progress);
          const next = getNextUp(val, progress, 3);
          const rp   = perf.byRoadmap[val.id];
          return (
            <div key={val.id} style={{ background: "#16161b", border: `1px solid ${val.color}33`, borderRadius: 12, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                  <RadialProgress pct={s.pct} color={val.color} size={48} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{s.pct}%</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{val.label}</div>
                  <div style={{ fontSize: 12, color: val.accent }}>{s.done}/{s.total} topics</div>
                  {rp?.attempted > 0 && (
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "#555" }}>Proficiency</span>
                        <span style={{ color: rp.avgProficiency >= 70 ? "#52b788" : "#ee9b00", fontWeight: 600 }}>{rp.avgProficiency || 0}%</span>
                      </div>
                      <div style={{ height: 3, background: "#1e1e24", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${rp.avgProficiency || 0}%`,
                          background: rp.avgProficiency >= 70 ? "#52b788" : "#ee9b00", borderRadius: 2 }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: next.length ? 10 : 0 }}>
                {Object.entries(val.sections).map(([sec, ts]) => {
                  const flat = flatTopicNames(ts);
                  const d = flat.filter(t => progress[`${val.id}::${t}`]).length;
                  return (
                    <div key={sec} style={{ marginBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                        fontSize: 10, color: "#555", marginBottom: 2 }}>
                        <span>{sec}</span><span>{d}/{flat.length}</span>
                      </div>
                      <div style={{ background: "#0f0f13", borderRadius: 3, height: 3 }}>
                        <div style={{ height: "100%", width: `${flat.length ? Math.round((d/flat.length)*100) : 0}%`,
                          background: val.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {next.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase",
                    letterSpacing: 1, marginBottom: 4 }}>Up next</div>
                  {next.map(({ topic }) => (
                    <div key={topic} style={{ fontSize: 12, color: "#777", padding: "2px 0", display: "flex", gap: 5 }}>
                      <span style={{ color: val.accent }}>→</span> {topic}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => onOpenRoadmap(val.id)}
                style={{ width: "100%", padding: "8px", background: val.color + "22",
                  border: `1px solid ${val.color}44`, borderRadius: 6, color: val.accent,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Open →</button>
            </div>
          );
        })}
      </div>

      {/* ── XP & Badges ── */}
      {/* ── XP & Level ── */}
      <div style={{ background: "#16161b", borderRadius: 12, border: "1px solid #1e1e24",
        padding: "16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{level.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: level.color }}>{level.name}</span>
              <span style={{ fontSize: 13, color: "#888", fontVariantNumeric: "tabular-nums" }}>{xp.toLocaleString()} XP</span>
            </div>
            <div style={{ background: "#1e1e24", borderRadius: 4, height: 7, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: level.color, borderRadius: 4, transition: "width 0.5s" }} />
            </div>
            {nextLevel && (
              <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                {(nextLevel.min - xp).toLocaleString()} XP to {nextLevel.icon} {nextLevel.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Milestone Badges ── */}
      <div style={{ background: "#16161b", borderRadius: 12, border: "1px solid #1e1e24",
        padding: "16px", marginBottom: 12 }}>
        {label(`🏅 Badges (${(xpData?.badges || []).length} / ${MILESTONE_BADGES.length})`)}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 8,
          boxSizing: "border-box",
        }}>
          {MILESTONE_BADGES.map(badge => {
            const earned = (xpData?.badges || []).includes(badge.id);
            return (
              <div key={badge.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: earned ? "#1e1e24" : "#0f0f13",
                border: `1px solid ${earned ? "#2a2a35" : "#1a1a1a"}`,
                borderRadius: 8, padding: "8px 10px",
                opacity: earned ? 1 : 0.35,
                minWidth: 0, overflow: "hidden",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{badge.icon}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: earned ? "#ccc" : "#444",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#444", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                    {badge.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Story Badges ── */}
      {(xpData?.aiBadges || []).length > 0 && (
        <div style={{ background: "#16161b", borderRadius: 12, border: "1px solid #1e1e24",
          padding: "16px", marginBottom: 12 }}>
          {label(`✨ Story Badges (${(xpData?.aiBadges || []).length})`)}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...(xpData?.aiBadges || [])].reverse().map(badge => (
              <div key={badge.id} style={{ display: "flex", alignItems: "center", gap: 10,
                background: "#1a1a2e", border: "1px solid #7b5ea733",
                borderRadius: 8, padding: "10px 12px" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{badge.icon}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>{badge.name}</span>
                    <span style={{ fontSize: 9, background: "#7b5ea733", color: "#c4b5fd",
                      borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>AI</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {allNotes.length > 0 && (
        <div style={card}>
          {label(`📝 Notes (${allNotes.length})`)}
          <div style={{ display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
            {allNotes.map(([key, text]) => {
              const [rmId, topic] = key.split("::");
              const val = roadmaps[rmId];
              return (
                <div key={key}
                  onClick={() => onOpenNote?.({ roadmap: rmId, topic })}
                  style={{ background: "#0f0f13", border: `1px solid ${val?.color}22`,
                    borderRadius: 8, padding: "10px 12px",
                    cursor: onOpenNote ? "pointer" : "default",
                    transition: "border-color 0.15s" }}
                  onMouseEnter={e => { if (onOpenNote) e.currentTarget.style.borderColor = (val?.color || "#7b5ea7") + "55"; }}
                  onMouseLeave={e => { if (onOpenNote) e.currentTarget.style.borderColor = (val?.color || "#7b5ea7") + "22"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 10, color: val?.accent }}>{val?.label} · {topic}</div>
                    {onOpenNote && <span style={{ fontSize: 11, color: "#444" }}>↗</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5 }}>{text}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
