/*
 Abstraction classes for D3 to support generating charts/maps quickly without
 getting into the minutia of laying out all the SVG elements.

 Written for the freeCodeCamp Data Visualization projects, so I would quit
 writing essentially the same code repeatedly.

 tooltips are provided by d3-tip.js
 https://github.com/caged/d3-tip

 License: MIT
 */

class D3Object {
  /*
   Defaults to a width of 1000px with an aspect ratio of 16:9
   Use width and/or aspectRatio to dynamically set height
   Use height and width to just set the size of the chart
   Margins default to 10%, either pass a margins object or call setMargins to adjust with a percentage
   Call setLabels to change the labels from default or pass a full labels object
   */
  constructor(props = {}) {
    const aspectRatio = props.hasOwnProperty("aspectRatio")
      ? props.aspectRatio
      : 16 / 9;
    const width = props.hasOwnProperty("width") ? props.width : 1000;
    const height = props.hasOwnProperty("height")
      ? props.height
      : width / aspectRatio;
    const margins = props.hasOwnProperty("margins")
      ? props.margins
      : {
          top: height * 0.1,
          right: width * 0.1,
          bottom: height * 0.1,
          left: width * 0.1,
        };
    const labels = props.hasOwnProperty("labels")
      ? props.labels
      : {
          className: "labels",
          header: { id: "header", text: "Header" },
          footer: { id: "footer", text: "Footer" },
          left: { id: "left-label", text: "Left Label" },
          right: { id: "right-label", text: "Right Label" },
        };
    const tooltips = props.hasOwnProperty("tooltips") ? props.tooltips : false;

    // Don't require the className for label objects to be passed
    if (!labels.hasOwnProperty("className")) {
      labels.className = "labels";
    }
    this.height = height;
    this.width = width;
    this.margins = margins;
    this.labels = labels;
    this.tooltips = tooltips;
    this.svgGroups = {};
  }

  // Calculate our areas for rendering elements
  get plotArea() {
    return D3Object.calculateArea(this.height, this.width, 0, 0, this.margins);
  }

  get headerArea() {
    return D3Object.calculateArea(
      this.margins.top,
      this.plotArea.width,
      this.margins.left,
      0
    );
  }

  get footerArea() {
    return D3Object.calculateArea(
      this.margins.bottom,
      this.plotArea.width,
      this.margins.left,
      this.height - this.margins.bottom
    );
  }

  get leftLabelArea() {
    return D3Object.calculateArea(
      this.plotArea.height,
      this.margins.left,
      0,
      this.margins.top
    );
  }

  get rightLabelArea() {
    return D3Object.calculateArea(
      this.plotArea.height,
      this.margins.right,
      this.width - this.margins.right,
      this.margins.top
    );
  }

  get topRightArea() {
    return D3Object.calculateArea(
      this.margins.top,
      this.margins.right,
      this.width - this.margins.right,
      0
    );
  }

  get topLeftArea() {
    return D3Object.calculateArea(this.margins.top, this.margins.left, 0, 0);
  }

  get bottomRightArea() {
    return D3Object.calculateArea(
      this.margins.bottom,
      this.margins.right,
      this.width - this.margins.right,
      this.height - this.margins.bottom
    );
  }

  get bottomLeftArea() {
    return D3Object.calculateArea(
      this.margins.bottom,
      this.margins.left,
      0,
      this.height - this.margins.bottom
    );
  }

  static calculateMargins(percentage, height, width) {
    const percentValue = percentage < 1 ? percentage : percentage / 100;

    // if percent is 0, just return 0
    let marginX = !!percentValue ? width * percentValue : 0;
    let marginY = !!percentValue ? height * percentValue : 0;

    return {
      top: marginY,
      right: marginX,
      bottom: marginY,
      left: marginX,
    };
  }

  static calculateArea(height, width, startX, startY, margins) {
    // proportional = true, keeps aspect ratio of the area
    // For margins, pass a percentage value or a margins object
    // default is 0% of the area for no margins
    const areaMargins =
      margins === undefined
        ? D3Object.calculateMargins(0, height, width)
        : typeof margins === "number"
        ? D3Object.calculateMargins(margins, height, width)
        : margins;

    const area = {};
    area.height = height - (areaMargins.top + areaMargins.bottom);
    area.width = width - (areaMargins.right + areaMargins.left);
    area.X = startX + areaMargins.left;
    area.Y = startY + areaMargins.top;
    return area;
  }

  setMargins(percentage) {
    this.margins = D3Object.calculateMargins(
      percentage,
      this.height,
      this.width
    );
  }

  setLabels(labels = {}) {
    const myLabels = Object.keys(this.labels);
    Object.keys(labels).forEach((k1) => {
      if (myLabels.includes(k1)) {
        const myKeys = Object.keys(this.labels[k1]);
        Object.keys(labels[k1]).forEach((k2) => {
          if (myKeys.includes(k2)) {
            this.labels[k1][k2] = labels[k1][k2];
          }
        });
      }
    });
  }

  appendSVGGroup(name, area, id) {
    id = id === undefined ? name : id;
    this.svgGroups[name] = this.svg
      .append("g")
      .attr("id", id)
      .attr("transform", `translate(${area.X}, ${area.Y})`);
  }

  renderSVG(divID, className) {
    // Render the main SVG element, use viewBox for the most responsive behavior
    this.svg = d3
      .select(divID)
      .append("svg")
      .attr("class", className)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    if (this.tooltips) {
      this.tip = d3.tip().attr("class", "d3-tip");
      this.svg.call(this.tip);
    }
  }

  renderAreaGroups() {
    this.appendSVGGroup("plotGroup", this.plotArea);
    this.appendSVGGroup("headerGroup", this.headerArea);
    this.appendSVGGroup("footerGroup", this.footerArea);
    this.appendSVGGroup("leftGroup", this.leftLabelArea);
    this.appendSVGGroup("rightGroup", this.rightLabelArea);
    this.appendSVGGroup("topLeftGroup", this.topLeftArea);
    this.appendSVGGroup("topRightGroup", this.topRightArea);
    this.appendSVGGroup("bottomLeftGroup", this.bottomLeftArea);
    this.appendSVGGroup("bottomRightGroup", this.bottomRightArea);
  }

  addToolTips(data, displayFunc, props, tipDirection, element) {
    const tipDisplay = displayFunc !== undefined ? displayFunc : (d) => d;
    const tipProps = props !== undefined ? props : {};
    const direction = tipDirection !== undefined ? tipDirection : "n";
    if (!this.tooltips) {
      return;
    }
    this.svgGroups.plotGroup
      .selectAll(element)
      .data(data)
      .join(element)
      .on("mouseover", (d, i, n) => {
        Object.keys(tipProps).forEach((property) => {
          if (typeof tipProps[property] === "function") {
            this.tip.attr(property, tipProps[property](d));
          } else {
            this.tip.attr(property, tipProps[property]);
          }
        });
        this.tip.direction(direction);
        this.tip.html(tipDisplay(d));
        this.tip.show(d, n[i]);
        d3.select(n[i]).style("opacity", "0.5");
      })
      .on("mouseout", (d, i, n) => {
        this.tip.hide(d, n[i]);
        d3.select(n[i]).style("opacity", "1");
      });
  }

  renderLabel(group, placement, label, textRotation) {
    const { X, Y, fontSize } = placement;
    const { text, id } = label;
    if (text === "") {
      return;
    }

    group
      .append("text")
      .attr("id", id)
      .attr("class", this.labels.className)
      .attr("font-size", fontSize)
      .attr("x", X)
      .attr("y", Y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text(text);
    if (!!textRotation) {
      group
        .select("text")
        .attr("transform", `rotate(${textRotation}, ${X}, ${Y})`);
    }
  }

  renderLabels(labels) {
    //TODO: Figure out how to override or compute easier
    const headerPlacement = {
      X: this.headerArea.width / 2,
      Y: this.headerArea.height / 4,
      fontSize: this.headerArea.height / 2,
    };
    const subHeaderPlacement = {
      X: this.headerArea.width / 2,
      Y: (this.headerArea.height * 3) / 4,
      fontSize: this.headerArea.height / 4,
    };
    const rightLabelPlacement = {
      X: this.rightLabelArea.width / 2,
      Y: this.rightLabelArea.height / 2,
      fontSize: this.rightLabelArea.width / 4,
    };
    const leftLabelPlacement = {
      X: this.leftLabelArea.width / 2,
      Y: this.leftLabelArea.height / 2,
      fontSize: this.leftLabelArea.width / 4,
    };
    const footerPlacement = {
      X: this.footerArea.width / 2,
      Y: (this.footerArea.height * 3) / 4,
      fontSize: this.footerArea.height / 4,
    };

    this.renderLabel(
      this.svgGroups.headerGroup,
      headerPlacement,
      labels.header,
      0
    );
    this.renderLabel(
      this.svgGroups.footerGroup,
      footerPlacement,
      labels.footer,
      0
    );
    this.renderLabel(
      this.svgGroups.leftGroup,
      leftLabelPlacement,
      labels.left,
      -90
    );
    this.renderLabel(
      this.svgGroups.rightGroup,
      rightLabelPlacement,
      labels.right,
      90
    );
    if (labels.hasOwnProperty("subheader")) {
      this.renderLabel(
        this.svgGroups.headerGroup,
        subHeaderPlacement,
        labels.subheader,
        0
      );
    }
  }

  render(props = {}) {
    const divID = props.hasOwnProperty("divID") ? props.divID : "#root";
    const svgClass = props.hasOwnProperty("svgClass")
      ? props.svgClass
      : "D3Object";
    this.renderSVG(divID, svgClass);
    this.renderAreaGroups();
    this.renderLabels(this.labels);
  }
}

class D3Chart extends D3Object {
  constructor(props = {}) {
    super(props);
    this.xAxis = {
      scale: undefined,
      axis: undefined,
      x: undefined,
      y: undefined,
    };
    this.yAxis = {
      scale: undefined,
      axis: undefined,
      x: undefined,
      y: undefined,
    };
  }

  setScale(axis, scale, range, padding) {
    this[axis].scale = scale().range(range);
    if (padding !== undefined) {
      this[axis].scale.padding(padding);
    }
  }

  setDomain(axis, arr) {
    this[axis].scale.domain(arr);
  }

  // TODO: Fix so that ticks can be customized
  setAxis(axis, axisFunc) {
    this[axis].axis = axisFunc().scale(this[axis].scale);
  }

  setXYValues() {
    this.xAxis.x = this.plotArea.X;
    this.xAxis.y = this.plotArea.Y + this.plotArea.height;
    this.yAxis.x = this.plotArea.X;
    this.yAxis.y = this.plotArea.Y;
  }

  addElementProperties(data, props, element) {
    Object.keys(props).forEach((property) => {
      this.svgGroups.plotGroup
        .selectAll(element)
        .data(data)
        .join(element)
        .attr(property, props[property]);
    });
  }

  renderAxis(axis, id) {
    this.svg
      .append("g")
      .call(this[axis].axis)
      .attr("transform", `translate(${this[axis].x}, ${this[axis].y})`)
      .attr("id", id);
  }

  render(props = {}) {
    const xAxisID = props.hasOwnProperty("xAxisID") ? props.xAxisID : "x-axis";
    const yAxisID = props.hasOwnProperty("yAxisID") ? props.yAxisID : "y-axis";
    super.render(props);
    this.setXYValues();
    // Only render the Axis, if defined
    if (this.xAxis.axis) {
      this.renderAxis("xAxis", xAxisID);
    }
    if (this.yAxis.axis) {
      this.renderAxis("yAxis", yAxisID);
    }
  }
}

class D3BarChart extends D3Chart {
  constructor(props = {}) {
    super(props);
  }

  addElementProperties(data, props) {
    super.addElementProperties(data, props, "rect");
  }

  addToolTips(data, displayFunc, props, tipDirection) {
    super.addToolTips(data, displayFunc, props, tipDirection, "rect");
  }

  renderBars(data, className, xValue, yValue, barWidth) {
    if (!this.xAxis.scale || !this.yAxis.scale) {
      console.error("scale not defined");
      return;
    }
    this.svgGroups.plotGroup
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", className)
      .attr("height", (d) => this.plotArea.height - this.yAxis.scale(yValue(d)))
      .attr("width", barWidth)
      .attr("x", (d) => this.xAxis.scale(xValue(d)))
      .attr("y", (d) => this.yAxis.scale(yValue(d)));
  }

  render(props = {}) {
    const data = props.hasOwnProperty("data") ? props.data : [];
    const barClassName = props.hasOwnProperty("barClassName")
      ? props.barClassName
      : "bar";
    const xValue = props.hasOwnProperty("xValue") ? props.xValue : (d) => d[0];
    const yValue = props.hasOwnProperty("yValue") ? props.yValue : (d) => d[1];
    const barWidth = props.hasOwnProperty("barWidth")
      ? props.barWidth
      : this.plotArea.width / data.length;
    super.render(props);
    this.renderBars(data, barClassName, xValue, yValue, barWidth);
  }
}

class D3ScatterPlot extends D3Chart {
  constructor(props = {}) {
    super(props);
  }

  addElementProperties(data, props) {
    super.addElementProperties(data, props, "circle");
  }

  addToolTips(data, displayFunc, props, tipDirection) {
    super.addToolTips(data, displayFunc, props, tipDirection, "circle");
  }

  renderDots(data, className, xValue, yValue, radius) {
    if (!this.xAxis.scale || !this.yAxis.scale) {
      console.error("scale not defined");
      return;
    }
    this.svgGroups.plotGroup
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", className)
      .attr("r", radius)
      .attr("cx", (d) => this.xAxis.scale(xValue(d)))
      .attr("cy", (d) => this.yAxis.scale(yValue(d)));
  }

  render(props = {}) {
    const data = props.hasOwnProperty("data") ? props.data : [];
    const dotClassName = props.hasOwnProperty("dotClassName")
      ? props.dotClassName
      : "dot";
    const xValue = props.hasOwnProperty("xValue") ? props.xValue : (d) => d[0];
    const yValue = props.hasOwnProperty("yValue") ? props.yValue : (d) => d[1];
    const radius = props.hasOwnProperty("radius") ? props.radius : 5;
    super.render(props);
    this.renderDots(data, dotClassName, xValue, yValue, radius);
  }
}
