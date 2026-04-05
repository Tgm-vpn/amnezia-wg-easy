'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseSubnet, stripCidr, networkCidr, generateIPs } = require('./Subnet');

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

describe('networkCidr', () => {
  it('returns /24 network for bare address', () => {
    assert.equal(networkCidr('10.8.0.x'), '10.8.0.0/24');
  });

  it('returns /16 network', () => {
    assert.equal(networkCidr('10.8.0.x/16'), '10.8.0.0/16');
  });

  it('computes true network address with bit arithmetic', () => {
    // 10.8.5.x/16 -> network is 10.8.0.0, not 10.8.5.0
    assert.equal(networkCidr('10.8.5.x/16'), '10.8.0.0/16');
  });

  it('returns /8 network', () => {
    assert.equal(networkCidr('10.8.0.x/8'), '10.0.0.0/8');
  });
});

describe('generateIPs', () => {
  it('/24: first IP is .2, last is .254, count is 253', () => {
    const ips = [...generateIPs('10.8.0.x')];
    assert.equal(ips[0], '10.8.0.2');
    assert.equal(ips[ips.length - 1], '10.8.0.254');
    assert.equal(ips.length, 253);
  });

  it('/24: does not include .0, .1, or .255', () => {
    const ips = [...generateIPs('10.8.0.x')];
    assert.ok(!ips.includes('10.8.0.0'));
    assert.ok(!ips.includes('10.8.0.1'));
    assert.ok(!ips.includes('10.8.0.255'));
  });

  it('/16: first IP is .0.2, skips .0 and .255 in last octet', () => {
    const gen = generateIPs('10.8.0.x/16');
    const first10 = [];
    for (const ip of gen) {
      first10.push(ip);
      if (first10.length >= 10) break;
    }
    assert.equal(first10[0], '10.8.0.2');
    // After 10.8.0.254 comes 10.8.1.1 (skipping 10.8.0.255, 10.8.1.0)
    assert.ok(!first10.includes('10.8.0.255'));
    assert.ok(!first10.includes('10.8.1.0'));
  });

  it('/16: total count is 65023', () => {
    // 256 blocks × 254 usable per block (.1-.254) = 65024, minus server (.0.1) = 65023
    let count = 0;
    for (const _ of generateIPs('10.8.0.x/16')) { // eslint-disable-line no-unused-vars
      count++;
    }
    assert.equal(count, 65023);
  });

  it('/16: transition from first to second /24 block', () => {
    const gen = generateIPs('10.8.0.x/16');
    let prev = null;
    const transition = [];
    for (const ip of gen) {
      if (prev === '10.8.0.254') {
        transition.push(ip);
        if (transition.length >= 2) break;
      }
      prev = ip;
    }
    assert.equal(transition[0], '10.8.1.1');
  });

  it('/30: generates only 1 IP (network+2, server is +1, broadcast is +3)', () => {
    const ips = [...generateIPs('10.8.0.x/30')];
    assert.equal(ips.length, 1);
    assert.equal(ips[0], '10.8.0.2');
  });
});
