'use strict';

/**
 * Parse WG_DEFAULT_ADDRESS into template and CIDR prefix length.
 * "10.8.0.x"    -> { template: "10.8.0.x", cidr: 24 }
 * "10.8.0.x/16" -> { template: "10.8.0.x", cidr: 16 }
 */
function parseSubnet(wgDefaultAddress) {
  const slashIdx = wgDefaultAddress.indexOf('/');
  if (slashIdx === -1) {
    return { template: wgDefaultAddress, cidr: 24 };
  }
  return {
    template: wgDefaultAddress.slice(0, slashIdx),
    cidr: parseInt(wgDefaultAddress.slice(slashIdx + 1), 10),
  };
}

/**
 * Remove CIDR suffix from an address string.
 * "10.8.0.2/16" -> "10.8.0.2"
 * "10.8.0.2"    -> "10.8.0.2"
 */
function stripCidr(str) {
  const slashIdx = str.indexOf('/');
  return slashIdx === -1 ? str : str.slice(0, slashIdx);
}

function ipToUint32(ip) {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function uint32ToIp(num) {
  return [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF,
  ].join('.');
}

/**
 * Compute the network address in CIDR notation using bit arithmetic.
 * "10.8.5.x/16" -> "10.8.0.0/16"
 * "10.8.0.x"    -> "10.8.0.0/24"
 */
function networkCidr(wgDefaultAddress) {
  const { template, cidr } = parseSubnet(wgDefaultAddress);
  const baseIp = template.replace('x', '0');
  const mask = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const network = (ipToUint32(baseIp) & mask) >>> 0;
  return `${uint32ToIp(network)}/${cidr}`;
}

/**
 * Generator that yields available client IP addresses for the given subnet.
 * Skips: network address, server (+1), broadcast, and any .0/.255 last octets.
 */
function* generateIPs(wgDefaultAddress) {
  const { template, cidr } = parseSubnet(wgDefaultAddress);
  const baseIp = template.replace('x', '0');
  const mask = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const network = (ipToUint32(baseIp) & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;

  // Start from network + 2 (skip network address and server at +1)
  for (let ip = network + 2; ip < broadcast; ip++) {
    const lastOctet = ip & 0xFF;
    if (lastOctet === 0 || lastOctet === 255) continue;
    yield uint32ToIp(ip);
  }
}

/**
 * Find the first free IP address in the subnet.
 * @param {string} wgDefaultAddress - e.g. "10.8.0.x/16"
 * @param {Set<string>} usedAddresses - set of occupied IP strings (no CIDR)
 * @returns {string|null} - free IP or null if subnet is full
 */
function findFreeAddress(wgDefaultAddress, usedAddresses) {
  for (const ip of generateIPs(wgDefaultAddress)) {
    if (!usedAddresses.has(ip)) return ip;
  }
  return null;
}

module.exports = { parseSubnet, stripCidr, networkCidr, generateIPs, findFreeAddress };
