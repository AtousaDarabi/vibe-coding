import { useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  Check,
  Heart,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import "./Profile.css";

const user = {
  alias: "Burk69",
  id: "GC-2026-0069",
  firstName: "Albert",
  familyName: "Einstein",
  birthday: "01.10.1991",
  achievements: [
    { id: "alpha6", name: "Mission Alpha 6", xp: 50 },
    { id: "beta7", name: "Mission Beta 7", xp: 60 },
  ],
};

const people = [
  { id: "GC-2026-0069", alias: "Burk69", xp: 110 },
  { id: "GC-2026-0096", alias: "Sara96", xp: 50 },
  { id: "GC-2026-0112", alias: "Lina_HN", xp: 85 },
  { id: "GC-2026-0147", alias: "NeckarMax", xp: 40 },
  { id: "GC-2026-0203", alias: "Tomi22", xp: 20 },
];

const groups = ["Neckar Cleanup", "Tree Planters", "Bike to Work"];

function ProfileCard() {
  const totalXp = user.achievements.reduce((sum, item) => sum + item.xp, 0);

  return (
    <article className="profile-card">
      <div className="profile-card-head">
        <div className="profile-photo">
          <UserRound size={58} strokeWidth={1.5} />
          <span className="profile-xp">{totalXp} XP</span>
        </div>
        <div className="profile-alias">
          <span className="eyebrow">ALIAS</span>
          <strong>{user.alias}</strong>
        </div>
      </div>

      <div className="profile-id">
        <span>ID:</span> {user.id}
      </div>

      <dl className="profile-facts">
        <div>
          <dt>First name</dt>
          <dd>{user.firstName}</dd>
        </div>
        <div>
          <dt>Family name</dt>
          <dd>{user.familyName}</dd>
        </div>
        <div>
          <dt>Birthday</dt>
          <dd>{user.birthday}</dd>
        </div>
      </dl>

      <h2 className="profile-subtitle">
        <Star size={15} /> Achievements <Star size={15} />
      </h2>
      <ul className="achievement-list">
        {user.achievements.map((achievement) => (
          <li key={achievement.id}>
            <span>{achievement.name}</span>
            <i />
            <strong>{achievement.xp} XP</strong>
          </li>
        ))}
      </ul>

      <p className="profile-note">
        Everyone gets one ID after registering. To collect rewards you have to
        be registered.
      </p>
    </article>
  );
}

function CommunityCard() {
  const [joinedGroup, setJoinedGroup] = useState(null);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [sortByXp, setSortByXp] = useState(true);
  const [favorites, setFavorites] = useState(() => new Set());
  const [groupMembers, setGroupMembers] = useState(() => new Set());
  const [activePerson, setActivePerson] = useState(null);

  const visiblePeople = useMemo(
    () =>
      [...people].sort((a, b) =>
        sortByXp ? b.xp - a.xp : a.alias.localeCompare(b.alias),
      ),
    [sortByXp],
  );

  const toggleIn = (setter, id) =>
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <article className="community-card">
      <div className="community-head">
        <h2>My Community</h2>
        <div className="group-join">
          <button
            type="button"
            className="community-button"
            aria-expanded={groupPickerOpen}
            onClick={() => setGroupPickerOpen(!groupPickerOpen)}
          >
            <Users size={15} /> {joinedGroup ?? "Join a group"}
          </button>
          {groupPickerOpen && (
            <ul className="group-picker">
              {groups.map((group) => (
                <li key={group}>
                  <button
                    type="button"
                    onClick={() => {
                      setJoinedGroup(group);
                      setGroupPickerOpen(false);
                    }}
                  >
                    {group}
                    {joinedGroup === group && <Check size={14} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="community-list-head">
        <span>List of people (ID)</span>
        <button
          type="button"
          className="community-filter"
          onClick={() => setSortByXp(!sortByXp)}
        >
          <ArrowDownWideNarrow size={14} /> {sortByXp ? "By XP" : "By name"}
        </button>
      </div>

      <ul className="people-list">
        {visiblePeople.map((person) => {
          const isFavorite = favorites.has(person.id);
          const inGroup = groupMembers.has(person.id);
          const isActive = activePerson === person.id;
          return (
            <li key={person.id} className={isActive ? "person--active" : ""}>
              <button
                type="button"
                className="person-row"
                aria-expanded={isActive}
                onClick={() => setActivePerson(isActive ? null : person.id)}
              >
                <Heart
                  size={15}
                  className={isFavorite ? "heart--on" : ""}
                  fill={isFavorite ? "currentColor" : "none"}
                />
                <span className="person-name">
                  {person.alias}
                  <small>{person.id}</small>
                </span>
                <i />
                <strong>{person.xp} XP</strong>
              </button>
              {isActive && (
                <div className="person-actions">
                  <button
                    type="button"
                    disabled={!joinedGroup}
                    title={joinedGroup ? undefined : "Join a group first"}
                    onClick={() => toggleIn(setGroupMembers, person.id)}
                  >
                    <Users size={14} />
                    {inGroup ? "Remove from group" : "Add to group"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleIn(setFavorites, person.id)}
                  >
                    <Heart size={14} />
                    {isFavorite ? "Remove favorite" : "Add to favorites"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="profile-note">Tap a profile to see more options.</p>
    </article>
  );
}

function ProfilePage() {
  return (
    <div className="page-content profile-page">
      <a className="profile-back" href="#overview">
        <ArrowLeft size={15} /> Back to overview
      </a>
      <div className="profile-grid">
        <ProfileCard />
        <CommunityCard />
      </div>
    </div>
  );
}

export default ProfilePage;
