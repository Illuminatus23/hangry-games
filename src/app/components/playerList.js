import { GiSkullCrossedBones, GiHeartMinus, GiHearts, GiPerson } from "react-icons/gi";
import { playerHexColors } from '@/app/data/staticData';
import { weaponsStats } from "@/app/data/staticData";
import { IconContext } from "react-icons";

export default function PlayerList({ players }) {
  const sortedPlayers = players.toSorted((a, b) => (a.teamleader > b.teamleader) ? -1 : 1);
  function getTemp(leadership, int) {
    if (leadership > 6) {
      if (int > 6) {
        return "leader"
      }
      return "charismatic"

    } else if (leadership > 4) {
      if (int > 6) {
        return "quick witted"
      } else if (int > 4) {
        return "strategist"
      }
      return "erratic"
    } else {
      if (int > 6) {
        return "intelligent"
      } else if (int > 4) {
        return "loner"
      }
      return "hostile"
    }

  }
  function getTraining(dex, str) {
    if (str > 6) {
      if (dex > 6) {
        return "combat training"
      }
      return "strength training"
    } else if (str > 4) {
      if (dex > 6) {
        return "martial arts training"
      } else if (dex > 4) {
        return "endurance training"
      }
      return "naturally strong"
    } else {
      if (dex > 6) {
        return "martial arts training"
      } else if (dex > 4) {
        return "naturally dextrous"
      }
      return "no training"
    }
  }
  function getHideAndSeek(find, hide) {
    if (find > 6 && hide > 6) {
      return "killer"
    } else if (find > 6) {
      return "marksman"
    } else if (hide > 6) {
      return "stealthy"
    } else if (find > 4 && hide > 4) {
      return "hunter"
    } else if (find > 4) {
      return "spotter"
    } else if (hide > 4) {
      return "quiet"
    }
    return "careless"
  }
  function getTeamColor(player) {
    return (player.teamleader === -1) ? player.color : playerHexColors[player.teamleader - 1];
  }
  function bordercolor(player) {
    let borderclass = (player.teamleader === -1) ? 'border-transparent rounded-md p-5 m-2' : 'border-2 rounded-md p-5 m-2';
    if (player.health <= 0) {
      borderclass = 'border-gray-600 rounded-md p-5 m-2';
    }
    return borderclass
  }

  return sortedPlayers.map((player, idx) =>
    <div key={player.id} className={bordercolor(player)} style={{ borderColor: player.teamleader !== -1 ? playerHexColors[player.teamleader - 1] : undefined }} >
      <div className={(player.health <= 0) ? "text-gray-600" : ""}>
        <h3 className={(player.health <= 0) ? "text-xl text-red-600" : "text-xl"}>{player.name}
          {' '}<GiPerson className="inline" fill={player.color} />{' '}
          <HealthStatus health={player.health} />{' '}
          <IconContext.Provider value={{ attr: { className: 'inline' } }}>{weaponsStats[player.weapon].icon}</IconContext.Provider>
        </h3>
        {/* <p className="ml-2 text-sm">Dexterity:{player.dex}</p>
        <p className="ml-2 text-sm">Strength:{player.str}</p> */}
        <p className="text-xs mb-1 ml-1">DISTRICT {player.district}</p>
        <p className="text-xs ml-2 mb-1">{getTraining(player.dex, player.str)}, {getHideAndSeek(player.find, player.hide)}, {getTemp(player.lead, player.int)}</p>
        <p className="ml-2 text-sm capitalize">Location: {player.locationname}{/*  ({player.location}) */}</p>

        {
          player.teamleader != -1 ?
            <p className="ml-2 text-sm capitalize">Team: {players[player.teamleader - 1].name} <GiPerson className="inline" fill={getTeamColor(player)} /></p>
            :
            <p className="ml-2 text-sm capitalize">Team: none</p>
        }
        {
          player.death ?
            <p className="ml-2 text-xs font-semibold">{player.death}</p>
            :
            null
        }
      </div>
    </div>
  )
}

export function HealthStatus({ health }) {
  if (health >= 3) {
    return (
      <GiHearts className="inline" fill="oklch(0.393 0.095 152.535)" title="healthy" />
    )
  } else if (health <= 0) {
    return (
      <GiSkullCrossedBones className="inline" fill="oklch(0.446 0.03 256.802)" title="dead" />
    )
  } else if (health === 1) {
    return (
      <span className="text-sm">
        <GiHeartMinus className="inline" fill="oklch(0.505 0.213 27.518)" title="wounded" />
        <GiHeartMinus className="inline" fill="oklch(0.505 0.213 27.518)" title="wounded" />
      </span>
    )
  } else {
    return (
      <GiHeartMinus className="inline" fill="oklch(0.505 0.213 27.518)" title="wounded" />
    )
  }
}