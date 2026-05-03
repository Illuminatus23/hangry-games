import { GiSkullCrossedBones, GiHeartMinus, GiHearts, GiPerson } from "react-icons/gi";
import { playerHexColors } from '@/app/data/staticData';
import { weaponsStats } from "@/app/data/staticData";
import { IconContext } from "react-icons";
import { getTemp, getTraining, getHideAndSeek } from "@/tools/helpers";

export default function PlayerList({ players }) {
  const sortedPlayers = players.toSorted((a, b) => (a.teamleader > b.teamleader) ? -1 : 1);
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
        <hr className="border-stone-600 my-2" />
        <p className="text-xs mb-1 ml-1">{player.job}</p>
        <p className="text-xs mb-1 ml-1">{getTraining(player.dex, player.str)}, {getHideAndSeek(player.find, player.hide)}, {getTemp(player.lead, player.int)}</p>
        <hr className="border-stone-600 my-2" />
        <p className="text-sm capitalize ml-1">Location: {player.locationname}{/*  ({player.location}) */}</p>

        {
          player.teamleader != -1 ?
            <p className="text-sm capitalize ml-1">Team: {players[player.teamleader - 1].name} <GiPerson className="inline" fill={getTeamColor(player)} /></p>
            :
            <p className="text-sm capitalize ml-1">Team: none</p>
        }
        {
          player.death ?
            <p className="text-xs font-semibold ml-1">{player.death}</p>
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