import P5 from '../../p5';

export const angleBetween = (x1, y1, x2, y2) => {
  const axisS = new P5.Vector(50, 0);
  const lingAngle = new P5.Vector(x2 - x1, y2 - y1);
  return axisS.angleBetween(lingAngle);
};

export const distance = (x1, y1, x2, y2) => {
  const x = Math.abs(x2 - x1);
  const y = Math.abs(y2 - y1);
  return Math.sqrt(x * x * 1.0 + y * y);
};

const intersectLineCircle = function (p1, p2, cpt, r) {
  let sign = function (x) {
    return x < 0.0 ? -1 : 1;
  };

  let x1 = p1.copy().sub(cpt);
  let x2 = p2.copy().sub(cpt);

  let dv = x2.copy().sub(x1);
  let dr = dv.mag();
  let D = x1.x * x2.y - x2.x * x1.y;

  // evaluate if there is an intersection
  let di = r * r * dr * dr - D * D;
  if (di < 0.0) return [];

  let t = Math.sqrt(di);

  const ip = [];
  ip.push(new P5.Vector(D * dv.y + sign(dv.y) * dv.x * t, -D * dv.x + Math.abs(dv.y) * t).div(dr * dr).add(cpt));
  if (di > 0.0) {
    ip.push(new P5.Vector(D * dv.y - sign(dv.y) * dv.x * t, -D * dv.x - Math.abs(dv.y) * t).div(dr * dr).add(cpt));
  }
  return ip;
};

export const findIntersectLineCircle = (x1, y1, x2, y2, centerX, centerY, r) => {
  const vector1 = new P5.Vector(x1, y1);
  const vector2 = new P5.Vector(x2, y2);
  const vector3 = new P5.Vector(centerX, centerY);
  return intersectLineCircle(vector1, vector2, vector3, r);
};
