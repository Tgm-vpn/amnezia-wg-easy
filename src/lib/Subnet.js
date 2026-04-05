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

module.exports = { parseSubnet, stripCidr };
