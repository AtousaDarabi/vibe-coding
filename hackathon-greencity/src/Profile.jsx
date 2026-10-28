import { useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  Bike,
  Check,
  Coffee,
  Film,
  Gift,
  Heart,
  Lock,
  Pizza,
  Star,
  Ticket,
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

// Sample rewards; partners are placeholders, not real offers.
const rewards = [
  {
    id: "coffee",
    name: "Free coffee",
    partner: "Local café",
    xp: 50,
    Icon: Coffee,
  },
  {
    id: "bike",
    name: "Bike rental for a day",
    partner: "City bike share",
    xp: 100,
    Icon: Bike,
  },
  {
    id: "concert",
    name: "Concert ticket",
    partner: "Summer concert in the park",
    xp: 150,
    Icon: Ticket,
  },
  {
    id: "cinema",
    name: "Cinema ticket",
    partner: "Local cinema",
    xp: 200,
    Icon: Film,
  },
  {
    id: "pizza",
    name: "Free pizza",
    partner: "Local pizzeria",
    xp: 300,
    Icon: Pizza,
  },
];

const totalXp = user.achievements.reduce((sum, item) => sum + item.xp, 0);

function ProfileCard({ xp }) {
  return (
    <article className="profile-card">
      <div className="profile-card-head">
        <div className="profile-photo">
          <UserRound size={58} strokeWidth={1.5} />
          <span className="profile-xp">{xp} XP</span>
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

function RewardsCard({ xp, onRedeem }) {
  const [redeemed, setRedeemed] = useState({});

  return (
    <article className="rewards-card">
      <div className="rewards-head">
        <div>
          <h2>
            <Gift size={18} /> Rewards
          </h2>
          <p>Collect XP by helping your city, then swap it for rewards.</p>
        </div>
        <span className="rewards-balance">
          <Star size={14} /> {xp} XP available
        </span>
      </div>

      <ul className="reward-list">
        {rewards.map(({ id, name, partner, xp: cost, Icon }) => {
          const code = redeemed[id];
          const unlocked = xp >= cost;
          const missing = cost - xp;
          return (
            <li
              key={id}
              className={`reward ${unlocked || code ? "reward--unlocked" : ""}`}
            >
              <span className="reward-icon">
                <Icon size={22} />
              </span>
              <div className="reward-body">
                <strong>{name}</strong>
                <small>{partner}</small>
                <span className="reward-cost">{cost} XP</span>
                {!code && (
                  <div
                    className="reward-progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={cost}
                    aria-valuenow={Math.min(xp, cost)}
                    aria-label={`${name} progress`}
                  >
                    <span
                      style={{ width: `${Math.min(100, (xp / cost) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              {code ? (
                <span className="reward-code">
                  <Check size={14} /> Code: {code}
                </span>
              ) : (
                <button
                  type="button"
                  className="reward-button"
                  disabled={!unlocked}
                  onClick={() => {
                    onRedeem(cost);
                    setRedeemed((current) => ({
                      ...current,
                      [id]: `${id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    }));
                  }}
                >
                  {unlocked ? (
                    "Redeem"
                  ) : (
                    <>
                      <Lock size={13} /> {missing} XP to go
                    </>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <p className="profile-note">
        Sample rewards for this prototype. Show the code at the partner to
        collect your reward.
      </p>
    </article>
  );
}

function ProfilePage() {
  const [xp, setXp] = useState(totalXp);

  return (
    <div className="page-content profile-page">
      <a className="profile-back" href="#overview">
        <ArrowLeft size={15} /> Back to overview
      </a>
      <div className="profile-grid">
        <ProfileCard xp={xp} />
        <CommunityCard />
        <RewardsCard xp={xp} onRedeem={(cost) => setXp(xp - cost)} />
      </div>
    </div>
  );
}

export default ProfilePage;
