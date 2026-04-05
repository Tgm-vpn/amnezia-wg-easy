'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseSubnet, stripCidr } = require('./Subnet');

describe('parseSubnet', () => {
  it('defaults to /24 when no CIDR suffix', () => {
    const result = parseSubnet('10.8.0.x');
    assert.deepStrictEqual(result, { template: '10.8.0.x', cidr: 24 });
  });

  it('parses /16 CIDR suffix', () => {
    const result = parseSubnet('10.8.0.x/16');
    assert.deepStrictEqual(result, { template: '10.8.0.x', cidr: 16 });
  });

  it('parses /8 CIDR suffix', () => {
    const result = parseSubnet('10.0.0.x/8');
    assert.deepStrictEqual(result, { template: '10.0.0.x', cidr: 8 });
  });

  it('parses /30 CIDR suffix', () => {
    const result = parseSubnet('10.8.0.x/30');
    assert.deepStrictEqual(result, { template: '10.8.0.x', cidr: 30 });
  });
});

describe('stripCidr', () => {
  it('removes CIDR suffix', () => {
    assert.equal(stripCidr('10.8.0.2/16'), '10.8.0.2');
  });

  it('returns IP unchanged when no CIDR suffix', () => {
    assert.equal(stripCidr('10.8.0.2'), '10.8.0.2');
  });

  it('strips CIDR from template with x', () => {
    assert.equal(stripCidr('10.8.0.x/16'), '10.8.0.x');
  });
});
