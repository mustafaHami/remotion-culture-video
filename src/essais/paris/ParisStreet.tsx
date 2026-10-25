// Rue haussmannienne en maquette : trois immeubles alignés, le dernier en coupe sous un mur amovible.
import React, {useMemo} from 'react';
import type {Look} from '../../design/looks';
import {buildVoxelGeometry} from '../../voxel/geometry';
import {VoxelGrid} from '../../voxel/grid';
import {building, ground, sideWall} from '../../voxel/decor/haussmann';
import {VoxelModel} from '../../voxel/VoxelModel';

export const STREET = {
  groundX: 18,
  groundY: 45,
  /** Origine (plan) de l'immeuble en coupe. */
  cutOy: 20,
} as const;

// Pied du mur amovible, en coordonnées Three.js (plan : y = 29, x = 4).
const WALL_PIVOT = [STREET.cutOy + 9.5, 0, 4] as const;

const buildStreet = (look: Look) => {
  const t = look.voxel;
  const decor = new VoxelGrid();
  ground(decor, STREET.groundX, STREET.groundY);
  building(decor, t, 0, 0, {awning: 0, tone: false});
  building(decor, t, 0, 10, {awning: 1, tone: true});
  building(decor, t, 0, STREET.cutOy, {awning: 2, tone: false, cut: true});
  const wall = sideWall(t, 0, STREET.cutOy, {awning: 2, tone: false});
  // Les ombres sont calculées sans le mur amovible : la coupe est éclairée une fois le mur levé.
  return {
    decor: buildVoxelGeometry(decor, t),
    wall: buildVoxelGeometry(wall, t, {occluders: decor}),
  };
};

type Props = {
  look: Look;
  /** Soulèvement du mur latéral, de 0 (fermé) à 1 (sorti du cadre). */
  lift: number;
};

export const ParisStreet: React.FC<Props> = ({look, lift}) => {
  const {decor, wall} = useMemo(() => buildStreet(look), [look]);
  const opacity = lift < 0.75 ? 1 : 1 - (lift - 0.75) / 0.25;
  return (
    <>
      <VoxelModel geometry={decor} />
      {opacity > 0 ? (
        // Pivot au pied du mur : il monte en s'inclinant légèrement, comme un couvercle qu'on retire.
        <group position={[WALL_PIVOT[0] + lift * 3, lift * 46, WALL_PIVOT[2]]} rotation={[0, 0, -lift * 0.22]}>
          <VoxelModel geometry={wall} position={[-WALL_PIVOT[0], 0, -WALL_PIVOT[2]]} opacity={opacity} />
        </group>
      ) : null}
    </>
  );
};
