
import { useEffect, useRef } from 'react';
import { HexGrid, Layout, Hexagon, Text, Pattern, Path, Hex, GridGenerator } from 'react-hexgrid';
import { motion, delay } from 'motion/react';
import { playerHexColors } from '@/app/data/staticData';
import { IconContext } from 'react-icons';
import { GiPerson, GiHastyGrave } from 'react-icons/gi';
import { mapData } from '@/app/data/staticData';

export default function HexMapAnimated({ mapHexes, players, round }) {
    const drawPopulation = [];

    mapHexes.forEach((hex) => {
        const hexPop = [];
        let deadCount = 0;
        let liveCount = 0;
        let translateData = mapData.translateValues[hex.id];
        for (let i = 0; i < hex.pop.length; i++) {
            const xPos = (liveCount > 11) ? -19 + liveCount : -7 + liveCount;
            const yPos = (liveCount > 11) ? 5.0 : 2;
            const deadCx = (deadCount > 11) ? -19 + deadCount : -7 + deadCount;
            const deadCy = yPos - 7;

            const player = players.filter((player) => player.id === hex.pop[i])[0];
            const teamColor = (player.teamleader === -1 || round === 0) ? player.color : playerHexColors[player.teamleader - 1];

            const oldLocation = mapData.translateValues[player.oldLocation]
            const adjustedPosition = (player.health > 0) ? [translateData[0]+xPos, translateData[1]+yPos] : [translateData[0] + deadCx, translateData[1] + deadCy]

            const initialTransition = {
                duration: 0.8,
                delay: (round !== 0) ? i * .18 : 0,
                ease: [0, 0.71, 0.2, 1.01],
            }

            const moveAnimate = { x: adjustedPosition[0], y: adjustedPosition[1] }
            const movetransition = {
                type: "spring",
                visualDuration: (player.health <= 0)? .5: 1,
                bounce: 0.2,
                delay: (player.health <= 0) ? 0 : (i * .1)+.5
            }

            if (player.health <= 0) { deadCount++ } else { liveCount++ }
            //player.oldLocation = hex.id;
            hexPop.push(
                <g
                    key={hex.pop[i]}
                    className='playerIcon'>

                    <motion.g
                        transition={movetransition}
                        //initial={false}
                        initial={{ x: oldLocation[0]+xPos, y: oldLocation[1]+yPos }}
                        animate={moveAnimate}
                        
                    >
                        <IconContext.Provider value={{ attr: { fill: teamColor, stroke: 'gray', strokeWidth: '1' } }} >
                            {
                                (player.health <= 0) ?
                                    <GiHastyGrave size='2.5' />
                                    :
                                    <GiPerson size='3'/>
                            }
                        </IconContext.Provider>
                        {/* </motion.g> */}
                        <rect className="playerPopup" x="-0.75em" ry="2" y={-4 + yPos} width="1.5em" height=".25em" fill={player.color} />
                        <Text className="playerPopup" textAnchor="middle" y={-1 + yPos} dy="">{player.name}</Text>
                    </motion.g>

                </g>)
        }
        drawPopulation.push(hexPop)
    });

    return (
        <HexGrid width="100%" height={800} viewBox="-50 -50 100 100">
            {/* Grid with manually inserted hexagons */}
            <Layout size={{ x: 10, y: 10 }} flat={true} spacing={1.1} origin={{ x: 0, y: 0 }}>

                {
                    mapHexes.map((hexData, idx) =>

                        <Hexagon key={idx} q={hexData.hex.q} r={hexData.hex.r} s={hexData.hex.s} className={hexData.styleName} stroke={hexData.hexstroke}>
                            <Text>{hexData.biome}</Text>
                        </Hexagon>
                    )
                }
                {
                    drawPopulation.map((peep, idx) =>
                        peep
                    )
                }
            </Layout>
        </HexGrid>
    );
}

