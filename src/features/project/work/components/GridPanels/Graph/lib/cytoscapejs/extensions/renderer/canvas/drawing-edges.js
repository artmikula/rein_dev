/* global Path2D */

import { GRAPH_LINK_TYPE } from 'features/shared/constants';
import { isDirectConstraint, isUndirectConstraint } from '../../../../../utils';
import P5 from '../../../../p5';
import * as util from '../../../util';

let CRp = {};

CRp.drawEdge = function (
  context,
  edge,
  shiftToOriginWithBb,
  drawLabel = true,
  shouldDrawOverlay = true,
  shouldDrawOpacity = true
) {
  let r = this;
  let rs = edge._private.rscratch;

  if (shouldDrawOpacity && !edge.visible()) {
    return;
  }

  // if bezier ctrl pts can not be calculated, then die
  if (rs.badLine || rs.allpts == null || isNaN(rs.allpts[0])) {
    // isNaN in case edge is impossible and browser bugs (e.g. safari)
    return;
  }

  let bb;
  if (shiftToOriginWithBb) {
    bb = shiftToOriginWithBb;

    context.translate(-bb.x1, -bb.y1);
  }

  let opacity = shouldDrawOpacity ? edge.pstyle('opacity').value : 1;
  let lineOpacity = shouldDrawOpacity ? edge.pstyle('line-opacity').value : 1;

  let lineStyle = edge.pstyle('line-style').value;
  let edgeWidth = edge.pstyle('width').pfValue;
  let lineCap = edge.pstyle('line-cap').value;

  let effectiveLineOpacity = opacity * lineOpacity;
  // separate arrow opacity would require arrow-opacity property
  let effectiveArrowOpacity = opacity * lineOpacity;

  let drawLine = (strokeOpacity = effectiveLineOpacity) => {
    context.lineWidth = edgeWidth;
    context.lineCap = lineCap;

    r.eleStrokeStyle(context, edge, strokeOpacity);
    r.drawEdgePath(edge, context, rs.allpts, lineStyle);

    context.lineCap = 'butt'; // reset for other drawing functions
  };

  let drawOverlay = () => {
    if (!shouldDrawOverlay) {
      return;
    }

    r.drawEdgeOverlay(context, edge);
  };

  let drawArrows = (arrowOpacity = effectiveArrowOpacity) => {
    r.drawArrowheads(context, edge, arrowOpacity);
  };

  let drawText = () => {
    r.drawElementText(context, edge, null, drawLabel);
  };

  context.lineJoin = 'round';

  let ghost = edge.pstyle('ghost').value === 'yes';

  if (ghost) {
    let gx = edge.pstyle('ghost-offset-x').pfValue;
    let gy = edge.pstyle('ghost-offset-y').pfValue;
    let ghostOpacity = edge.pstyle('ghost-opacity').value;
    let effectiveGhostOpacity = effectiveLineOpacity * ghostOpacity;

    context.translate(gx, gy);

    drawLine(effectiveGhostOpacity);
    drawArrows(effectiveGhostOpacity);

    context.translate(-gx, -gy);
  }

  drawLine();
  drawArrows();
  drawOverlay();
  drawText();

  if (shiftToOriginWithBb) {
    context.translate(bb.x1, bb.y1);
  }
};

CRp.drawEdgeOverlay = function (context, edge) {
  if (!edge.visible()) {
    return;
  }

  let overlayOpacity = edge.pstyle('overlay-opacity').value;

  if (overlayOpacity === 0) {
    return;
  }

  let r = this;
  let usePaths = r.usePaths();
  let rs = edge._private.rscratch;

  let overlayPadding = edge.pstyle('overlay-padding').pfValue;
  let overlayWidth = 2 * overlayPadding;
  let overlayColor = edge.pstyle('overlay-color').value;

  context.lineWidth = overlayWidth;

  if (rs.edgeType === 'self' && !usePaths) {
    context.lineCap = 'butt';
  } else {
    context.lineCap = 'round';
  }

  r.colorStrokeStyle(context, overlayColor[0], overlayColor[1], overlayColor[2], overlayOpacity);

  r.drawEdgePath(edge, context, rs.allpts, 'solid');
};

CRp.drawEdgePath = function (edge, context, pts, type) {
  let rs = edge._private.rscratch;
  let canvasCxt = context;
  let path;
  let pathCacheHit = false;
  let usePaths = this.usePaths();
  let lineDashPattern = edge.pstyle('line-dash-pattern').pfValue;
  let lineDashOffset = edge.pstyle('line-dash-offset').pfValue;

  if (usePaths) {
    let pathCacheKey = pts.join('$');
    let keyMatches = rs.pathCacheKey && rs.pathCacheKey === pathCacheKey;

    if (keyMatches) {
      path = context = rs.pathCache;
      pathCacheHit = true;
    } else {
      path = context = new Path2D();
      rs.pathCacheKey = pathCacheKey;
      rs.pathCache = path;
    }
  }

  const { isNotRelation } = edge._private.data;
  const linkType = edge._private.data.type;

  if (isNotRelation) {
    canvasCxt.setLineDash(lineDashPattern);
    canvasCxt.lineDashOffset = lineDashOffset;
  } else if (isDirectConstraint(linkType) || isUndirectConstraint(linkType)) {
    canvasCxt.setLineDash(lineDashPattern);
    canvasCxt.lineDashOffset = lineDashOffset;
  } else {
    canvasCxt.setLineDash([]);
  }

  if (!pathCacheHit && !rs.badLine) {
    if (context.beginPath) {
      context.beginPath();
    }

    if (isNotRelation) {
      drawNotLine(context, pts);
      context.moveTo(pts[0], pts[1]);
      context.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
    } else if (isDirectConstraint(linkType)) {
      drawHalfCircle(context, pts, linkType);
    } else {
      context.moveTo(pts[0], pts[1]);
      for (let i = 2; i + 1 < pts.length; i += 2) {
        context.lineTo(pts[i], pts[i + 1]);
      }
    }
  }

  context = canvasCxt;
  if (usePaths) {
    context.stroke(path);
  } else {
    context.stroke();
  }

  // reset any line dashes
  if (context.setLineDash) {
    // for very outofdate browsers
    context.setLineDash([]);
  }
};

// custom method
const drawHalfCircle = (context, pts, linkType) => {
  const x1 = pts[0];
  const y1 = pts[1];
  const x2 = pts[pts.length - 2];
  const y2 = pts[pts.length - 1];
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  const r = util.distance(x1, y1, x2, y2) / 2;
  const angleBetween = util.angleBetween(x1, y1, x2, y2);

  if (linkType === GRAPH_LINK_TYPE.MASK) {
    if (y2 <= y1) {
      context.arc(centerX, centerY, r, angleBetween, Math.PI + angleBetween);
    } else {
      context.arc(centerX, centerY, r, Math.PI + angleBetween, 2 * Math.PI + angleBetween);
    }
  } else {
    if (y2 <= y1) {
      context.arc(centerX, centerY, r, Math.PI + angleBetween, 2 * Math.PI + angleBetween);
    } else {
      context.arc(centerX, centerY, r, angleBetween, Math.PI + angleBetween);
    }
  }
};

const drawNotLine = (context, pts) => {
  const x1 = pts[0];
  const y1 = pts[1];
  const x2 = pts[pts.length - 2];
  const y2 = pts[pts.length - 1];
  let r = util.distance(x1, y1, x2, y2) / 8;
  if (r > 20) {
    r = 20;
  }
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  const points = util.findIntersectLineCircle(x1, y1, x2, y2, centerX, centerY, r);
  const angleBetween = util.angleBetween(x1, y1, x2, y2);
  if (y2 >= y1) {
    context.arc(points[0].x, points[0].y, r, angleBetween, Math.PI + angleBetween);
    context.arc(points[1].x, points[1].y, r, angleBetween, Math.PI + angleBetween, true);
  } else {
    context.arc(points[0].x, points[0].y, r, Math.PI + angleBetween, angleBetween);
    context.arc(points[1].x, points[1].y, r, Math.PI + angleBetween, angleBetween, true);
  }
}; // custom method

CRp.drawArrowheads = function (context, edge, opacity) {
  const linkType = edge._private.data.type;
  if (!isUndirectConstraint(linkType)) {
    let rs = edge._private.rscratch;
    let isHaystack = rs.edgeType === 'haystack';

    if (!isHaystack) {
      this.drawArrowhead(context, edge, 'source', rs.arrowStartX, rs.arrowStartY, rs.srcArrowAngle, opacity);
    }

    this.drawArrowhead(context, edge, 'mid-target', rs.midX, rs.midY, rs.midtgtArrowAngle, opacity);

    this.drawArrowhead(context, edge, 'mid-source', rs.midX, rs.midY, rs.midsrcArrowAngle, opacity);

    if (!isHaystack) {
      if (isDirectConstraint(edge._private.data.type)) {
        const targetY = edge._private.target._private.position.y;
        const sourceY = edge._private.source._private.position.y;
        let tgtArrowAngle = targetY >= sourceY ? 0.35 * Math.PI : -0.35 * Math.PI;
        if (edge._private.data.type === GRAPH_LINK_TYPE.REQUIRE) {
          tgtArrowAngle = targetY >= sourceY ? -0.35 * Math.PI : 0.35 * Math.PI;
        }
        this.drawArrowhead(
          context,
          edge,
          'target',
          rs.arrowEndX,
          rs.arrowEndY,
          rs.tgtArrowAngle + tgtArrowAngle,
          opacity
        );
      } else {
        this.drawArrowhead(context, edge, 'target', rs.arrowEndX, rs.arrowEndY, rs.tgtArrowAngle, opacity);
      }
    }
  }
};

CRp.drawArrowhead = function (context, edge, prefix, x, y, angle, opacity) {
  if (isNaN(x) || x == null || isNaN(y) || y == null || isNaN(angle) || angle == null) {
    return;
  }

  let self = this;
  let arrowShape = edge.pstyle(prefix + '-arrow-shape').value;
  if (arrowShape === 'none') {
    return;
  }

  let arrowClearFill = edge.pstyle(prefix + '-arrow-fill').value === 'hollow' ? 'both' : 'filled';
  let arrowFill = edge.pstyle(prefix + '-arrow-fill').value;
  let edgeWidth = edge.pstyle('width').pfValue;
  let edgeOpacity = edge.pstyle('opacity').value;

  if (opacity === undefined) {
    opacity = edgeOpacity;
  }

  let gco = context.globalCompositeOperation;

  if (opacity !== 1 || arrowFill === 'hollow') {
    // then extra clear is needed
    context.globalCompositeOperation = 'destination-out';

    self.colorFillStyle(context, 255, 255, 255, 1);
    self.colorStrokeStyle(context, 255, 255, 255, 1);

    self.drawArrowShape(edge, context, arrowClearFill, edgeWidth, arrowShape, x, y, angle);

    context.globalCompositeOperation = gco;
  } // otherwise, the opaque arrow clears it for free :)

  let color = edge.pstyle(prefix + '-arrow-color').value;
  self.colorFillStyle(context, color[0], color[1], color[2], opacity);
  self.colorStrokeStyle(context, color[0], color[1], color[2], opacity);

  self.drawArrowShape(edge, context, arrowFill, edgeWidth, arrowShape, x, y, angle);
};

CRp.drawArrowShape = function (edge, context, fill, edgeWidth, shape, x, y, angle) {
  let r = this;
  let usePaths = this.usePaths() && shape !== 'triangle-cross';
  let pathCacheHit = false;
  let path;
  let canvasContext = context;
  let translation = { x, y };
  let scale = edge.pstyle('arrow-scale').value;
  let size = this.getArrowWidth(edgeWidth, scale);
  let shapeImpl = r.arrowShapes[shape];

  if (usePaths) {
    let cache = (r.arrowPathCache = r.arrowPathCache || []);
    let key = util.hashString(shape);
    let cachedPath = cache[key];

    if (cachedPath != null) {
      path = context = cachedPath;
      pathCacheHit = true;
    } else {
      path = context = new Path2D();
      cache[key] = path;
    }
  }

  if (!pathCacheHit) {
    if (context.beginPath) {
      context.beginPath();
    }
    if (usePaths) {
      // store in the path cache with values easily manipulated later
      shapeImpl.draw(context, 1, 0, { x: 0, y: 0 }, 1);
    } else {
      shapeImpl.draw(context, size, angle, translation, edgeWidth);
    }
    if (context.closePath) {
      context.closePath();
    }
  }

  context = canvasContext;

  if (usePaths) {
    // set transform to arrow position/orientation
    context.translate(x, y);
    context.rotate(angle);
    context.scale(size, size);
  }

  if (fill === 'filled' || fill === 'both') {
    if (usePaths) {
      context.fill(path);
    } else {
      context.fill();
    }
  }

  if (fill === 'hollow' || fill === 'both') {
    context.lineWidth = (shapeImpl.matchEdgeWidth ? edgeWidth : 1) / (usePaths ? size : 1);
    context.lineJoin = 'miter';

    if (usePaths) {
      context.stroke(path);
    } else {
      context.stroke();
    }
  }

  if (usePaths) {
    // reset transform by applying inverse
    context.scale(1 / size, 1 / size);
    context.rotate(-angle);
    context.translate(-x, -y);
  }
};

export default CRp;
