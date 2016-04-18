var data = [
];

var width = 1500;
var height = 800;
var margin = {
  top: 20,
  right: 20,
  bottom: 30,
  left: 50
};

var x = d3.scale.linear().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().scale(x).orient('bottom');
var yAxis = d3.svg.axis().scale(y).orient('left');

function line (getValue) {
  d3
    .svg
    .line()
    .x(function (d) { return x(d.i); })
    .y(function (d) { return y(getValue(d)); });
}

var svg =
  d3
    .select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

var meanLineGen =
  d3.svg
    .line(function (d) { return d.mean; })
    .x(function (d) { return x(d.i); })
    .y(function (d) { return y(d.mean); });

var maxLineGen =
  d3.svg
    .line(function (d) { return d.max; })
    .x(function (d) { return x(d.i); })
    .y(function (d) { return y(d.max); });

x.domain(d3.extent(data, function (d) { return d.i; }));
var yData =
  data.map(function (d) { return d.mean; })
    .concat(
      data.map(function(d) { return d.max; }));
y.domain(d3.extent(yData, function (d) { return d; }));

svg
  .append('g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0, ' + height + ')')
  .call(xAxis);

svg
  .append('g')
  .attr('class', 'y axis')
  .call(yAxis);

svg
  .append('svg:path')
  .attr('d', meanLineGen(data))
  .attr('stroke', 'blue')
  .attr('stroke-width', 2)
  .attr('fill', 'none')
  .attr('class', 'tag');

svg
  .append('svg:path')
  .attr('d', maxLineGen(data))
  .attr('stroke', 'purple')
  .attr('stroke-width', 2)
  .attr('fill', 'none')
  .attr('class', 'tag');
