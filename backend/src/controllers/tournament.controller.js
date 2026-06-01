import Tournament from '../models/Tournament.model.js';
import Hero from '../models/Hero.model.js';
import User from '../models/User.model.js';
import { HERO_TEMPLATES } from '../services/gameData.service.js';
import { resolveHeroDuel } from '../services/combat.service.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

const DIVISION_ORDER = ['bronze','silver','gold','platinum','diamond','legend'];

// Get or create the current active tournament
const getActiveTournament = async (format) => {
  let t = await Tournament.findOne({ format, status: { $in: ['signup','active','finals'] } });
  if (!t) {
    const signupEnd = new Date(Date.now() + 3 * 24 * 3600 * 1000); // 3 days
    const battlesEnd = new Date(signupEnd.getTime() + 2 * 24 * 3600 * 1000);
    const finalsEnd  = new Date(battlesEnd.getTime() + 1 * 24 * 3600 * 1000);
    t = await Tournament.create({ format, signup_end: signupEnd, battles_end: battlesEnd, finals_end: finalsEnd, status: 'signup' });
  }
  return t;
};

// GET /api/v1/tournament/:format  — get current tournament + player's team
export const getTournament = async (req, res, next) => {
  try {
    const { format = '3v3' } = req.params;
    if (!['3v3','5v5'].includes(format)) return res.status(400).json({ success: false, error: 'Invalid format' });

    const tournament = await getActiveTournament(format);
    const myTeam = tournament.teams.find(t => t.player_id?.toString() === req.user.id);

    res.json({ success: true, data: { tournament, my_team: myTeam || null } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/tournament/:format/signup — sign up with hero lineup
export const signUp = async (req, res, next) => {
  try {
    const { format = '3v3' } = req.params;
    const { hero_ids } = req.body;

    const heroCount = format === '3v3' ? 3 : 5;
    if (!hero_ids || hero_ids.length !== heroCount) {
      return res.status(400).json({ success: false, error: `Need exactly ${heroCount} heroes for ${format}` });
    }

    const tournament = await getActiveTournament(format);
    if (tournament.status !== 'signup') {
      return res.status(400).json({ success: false, error: 'Signup phase has ended' });
    }

    const alreadyIn = tournament.teams.find(t => t.player_id?.toString() === req.user.id);
    if (alreadyIn) return res.status(400).json({ success: false, error: 'Already signed up' });

    // Verify hero ownership
    const heroes = await Hero.find({ _id: { $in: hero_ids }, player_id: req.user.id, is_unlocked: true });
    if (heroes.length !== heroCount) {
      return res.status(400).json({ success: false, error: 'One or more heroes not owned/unlocked' });
    }

    tournament.teams.push({
      team_id: uuidv4(),
      player_id: req.user.id,
      hero_ids,
      division: 'bronze',
      tier: 1,
    });

    await tournament.save();
    res.json({ success: true, message: `Signed up for ${format} tournament`, data: { format, hero_ids } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/tournament/:format/battle — challenge an opponent
export const battleOpponent = async (req, res, next) => {
  try {
    const { format = '3v3' } = req.params;
    const { opponent_player_id } = req.body;

    const tournament = await getActiveTournament(format);
    if (tournament.status !== 'active') {
      // Auto-advance if signup ended
      if (tournament.status === 'signup' && new Date() > tournament.signup_end) {
        tournament.status = 'active';
        await tournament.save();
      } else {
        return res.status(400).json({ success: false, error: 'Battle phase not active' });
      }
    }

    const myTeam   = tournament.teams.find(t => t.player_id?.toString() === req.user.id);
    const oppTeam  = tournament.teams.find(t => t.player_id?.toString() === opponent_player_id);

    if (!myTeam)  return res.status(400).json({ success: false, error: 'You are not signed up' });
    if (!oppTeam) return res.status(404).json({ success: false, error: 'Opponent not found in tournament' });

    // King-of-the-Hill resolution
    const heroCount = format === '3v3' ? 3 : 5;
    const aHeroes = await Hero.find({ _id: { $in: myTeam.hero_ids }, is_unlocked: true });
    const bHeroes = await Hero.find({ _id: { $in: oppTeam.hero_ids }, is_unlocked: true });

    const log = [];
    let champA = null; let champB = null;
    let aIdx = 0; let bIdx = 0;
    let aWins = 0; let bWins = 0;

    // Best of 3 rounds
    for (let round = 1; round <= 3; round++) {
      const roundLog = [];
      let aChampI = 0; let bChampI = 0;

      // King of the Hill within round
      while (aChampI < aHeroes.length && bChampI < bHeroes.length) {
        const ha = aHeroes[aChampI];
        const hb = bHeroes[bChampI];
        const templateA = HERO_TEMPLATES.find(t => t.id === ha.template_id);
        const templateB = HERO_TEMPLATES.find(t => t.id === hb.template_id);

        const heroAStats = {
          atk: (templateA?.baseAtk || 500) * (1 + ha.level * 0.05) * (1 + ha.stars * 0.10),
          def: (templateA?.baseDef || 300) * (1 + ha.level * 0.03),
          hp:  (templateA?.baseHp  || 2000) * (1 + ha.level * 0.04),
          speed: templateA?.baseSpeed || 1.0,
        };
        const heroBStats = {
          atk: (templateB?.baseAtk || 500) * (1 + hb.level * 0.05) * (1 + hb.stars * 0.10),
          def: (templateB?.baseDef || 300) * (1 + hb.level * 0.03),
          hp:  (templateB?.baseHp  || 2000) * (1 + hb.level * 0.04),
          speed: templateB?.baseSpeed || 1.0,
        };

        const duel = resolveHeroDuel(heroAStats, heroBStats);
        roundLog.push({ heroA: templateA?.name, heroB: templateB?.name, winner: duel.winner, log: duel.log });

        if (duel.winner === 'A') { bChampI++; }
        else if (duel.winner === 'B') { aChampI++; }
        else { aChampI++; bChampI++; }
      }

      const roundWinner = aChampI < bChampI ? 'A' : bChampI < aChampI ? 'B' : 'draw';
      if (roundWinner === 'A') aWins++;
      else if (roundWinner === 'B') bWins++;
      log.push({ round, winner: roundWinner, duels: roundLog });

      if (aWins === 2 || bWins === 2) break;
    }

    const matchWinner = aWins > bWins ? 'attacker' : bWins > aWins ? 'defender' : 'draw';

    // Update records
    if (matchWinner === 'attacker') {
      myTeam.wins += 1;
      oppTeam.losses += 1;
      myTeam.war_points += 10;
      myTeam.crowns += 5;
    } else if (matchWinner === 'defender') {
      myTeam.losses += 1;
      oppTeam.wins += 1;
      oppTeam.war_points += 10;
      oppTeam.crowns += 5;
    }

    // Tier advancement (3 consecutive wins)
    if (matchWinner === 'attacker' && myTeam.wins % 3 === 0) {
      if (myTeam.tier < 5) myTeam.tier += 1;
      else {
        const divIdx = DIVISION_ORDER.indexOf(myTeam.division);
        if (divIdx < DIVISION_ORDER.length - 1) { myTeam.division = DIVISION_ORDER[divIdx + 1]; myTeam.tier = 1; }
      }
    }

    tournament.matches.push({
      round: tournament.matches.length + 1,
      team_a_id: myTeam.team_id,
      team_b_id: oppTeam.team_id,
      winner_team_id: matchWinner === 'attacker' ? myTeam.team_id : matchWinner === 'defender' ? oppTeam.team_id : null,
      log,
      played_at: new Date(),
    });

    await tournament.save();

    // Reward currencies
    const gemReward = matchWinner === 'attacker' ? 20 : 5;
    await User.findByIdAndUpdate(req.user.id, { $inc: { gems: gemReward, tournament_crowns: myTeam.crowns } });

    logger.info(`Tournament battle: ${req.user.id} vs ${opponent_player_id} — ${matchWinner}`);

    res.json({
      success: true,
      data: {
        result: matchWinner,
        rounds_won: { you: aWins, opponent: bWins },
        log,
        gem_reward: gemReward,
        my_record: { wins: myTeam.wins, losses: myTeam.losses, division: myTeam.division, tier: myTeam.tier },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/tournament/:format/rankings
export const getRankings = async (req, res, next) => {
  try {
    const { format = '3v3' } = req.params;
    const tournament = await getActiveTournament(format);

    const sorted = [...tournament.teams].sort((a, b) => {
      const divDiff = DIVISION_ORDER.indexOf(b.division) - DIVISION_ORDER.indexOf(a.division);
      if (divDiff !== 0) return divDiff;
      const tierDiff = b.tier - a.tier;
      if (tierDiff !== 0) return tierDiff;
      return b.wins - a.wins;
    });

    const ranks = sorted.map((t, i) => ({
      rank: i + 1,
      player_id: t.player_id,
      division: t.division,
      tier: t.tier,
      wins: t.wins,
      losses: t.losses,
      war_points: t.war_points,
    }));

    res.json({ success: true, data: ranks });
  } catch (error) {
    next(error);
  }
};
