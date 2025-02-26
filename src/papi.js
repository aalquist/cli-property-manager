//  Copyright 2018. Akamai Technologies, Inc
//  
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//  
//      http://www.apache.org/licenses/LICENSE-2.0
//  
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.


const _ = require('underscore');

/*
 * activation type used as a parameter in activateProperty
 */
const ActivationType = require('./enums/ActivationType');

/**
 * PAPI REST client
 */
class PAPI {
    constructor(openClient) {
        this.openClient = openClient;
    }

    _buildAccountSwitchKeyQuery(key, firstQueryParam = false) {
        

        if( key) {
            
            if( firstQueryParam) {
                return `?accountSwitchKey=${key}`;
            } else {
                return `&accountSwitchKey=${key}`;
            }

        } else {
            return "";
        }

        return value
    }

    findProperty(name, key) {
        let searchBody = {
            "propertyName": name
        };
        
        return this.openClient.post(`/papi/v1/search/find-by-value${this._buildAccountSwitchKeyQuery(key,true)}`, searchBody);
    }

    createProperty(name, productId, contractId, groupId, ruleFormat, propertyId, propertyVersion, copyHostnames = false) {
        let url = `/papi/v0/properties?groupId=${groupId}&contractId=${contractId}`;
        let body = {
            "productId": productId,
            "propertyName": name,
        };
        if (_.isString(ruleFormat)) {
            body.ruleFormat = ruleFormat;
        }
        if (_.isNumber(propertyId) && _.isNumber(propertyVersion)) {
            body.cloneFrom = {
                "propertyId": propertyId,
                "version": propertyVersion,
                "copyHostnames": copyHostnames
            };
        }
        return this.openClient.post(url, body);
    }

    createNewPropertyVersion(propertyId, createFromVersion, createFromVersionEtag) {
        let postBody = {
            createFromVersion,
            createFromVersionEtag
        };
        let url = `/papi/v0/properties/${propertyId}/versions/`;
        return this.openClient.post(url, postBody);
    }

    latestPropertyVersion(propertyId, key) {
        let url = `/papi/v0/properties/${propertyId}/versions/latest${this._buildAccountSwitchKeyQuery(key,true)}`;
        return this.openClient.get(url);
    }

    getPropertyVersion(propertyId, versionId, key) {
        let url = `/papi/v0/properties/${propertyId}/versions/${versionId}${this._buildAccountSwitchKeyQuery(key,true)}`;
        return this.openClient.get(url);
    }

    setRuleFormat(ruleFormat) {
        let clientSettings = {
            "ruleFormat": ruleFormat,
        };
        return this.setClientSettings(clientSettings);
    }

    /**
     * Set or unset PAPI id prefixes
     * @param usePrefixes
     */
    setClientSettings(clientSettings) {
        let url = '/papi/v0/client-settings';
        return this.openClient.put(url, clientSettings);
    }

    getClientSettings(key) {
        let url = `/papi/v0/client-settings${this._buildAccountSwitchKeyQuery(key,true)}`;
        return this.openClient.get(url);
    }

    listProducts(contractId) {
        return this.openClient.get(`/papi/v0/products?contractId=${contractId}`);
    }

    listContracts() {
        return this.openClient.get('/papi/v0/contracts');
    }

    listGroups() {
        return this.openClient.get('/papi/v0/groups');
    }

    getPropertyVersionRules(propertyId, propertyVersion, ruleFormat, key) {
        let url = `/papi/v0/properties/${propertyId}/versions/${propertyVersion}/rules${this._buildAccountSwitchKeyQuery(key,true)}`;
        let headers = {};
        if (_.isString(ruleFormat)) {
            headers.Accept = `application/vnd.akamai.papirules.${ruleFormat}+json`;
        }
        return this.openClient.get(url, headers);
    }

    storePropertyVersionRules(propertyId, propertyVersion, rules, ruleFormat) {
        let url = `/papi/v0/properties/${propertyId}/versions/${propertyVersion}/rules`;
        let headers = {
            'Content-Type': "application/json"
        };
        if (_.isString(ruleFormat)) {
            headers["Content-Type"] = `application/vnd.akamai.papirules.${ruleFormat}+json`;
            headers.Accept = `application/vnd.akamai.papirules.${ruleFormat}+json`;
        }
        return this.openClient.put(url, rules, headers);
    }

    validatePropertyVersionRules(propertyId, propertyVersion, rules, ruleFormat) {
        let url = `/papi/v0/properties/${propertyId}/versions/${propertyVersion}/rules?dryRun=true`;
        let headers = {
            'Content-Type': "application/json"
        };
        if (_.isString(ruleFormat)) {
            headers["Content-Type"] = `application/vnd.akamai.papirules.${ruleFormat}+json`;
            headers.Accept = `application/vnd.akamai.papirules.${ruleFormat}+json`;

        }
        return this.openClient.put(url, rules, headers);
    }

    getPropertyVersionHostnames(propertyId, propertyVersion, key) {
        let url = `/papi/v0/properties/${propertyId}/versions/${propertyVersion}/hostnames${this._buildAccountSwitchKeyQuery(key,true)}`;
        return this.openClient.get(url);
    }

    storePropertyVersionHostnames(propertyId, propertyVersion, hostnames, contractId, groupId) {
        let url = `/papi/v0/properties/${propertyId}/versions/${propertyVersion}/hostnames?contractId=${contractId}&groupId=${groupId}`;
        return this.openClient.put(url, hostnames);
    }

    listCpcodes(contractId, groupId) {
        let url = `/papi/v0/cpcodes?contractId=${contractId}&groupId=${groupId}`;
        return this.openClient.get(url);
    }

    listEdgeHostnames(contractId, groupId) {
        let url = `/papi/v0/edgehostnames/?contractId=${contractId}&groupId=${groupId}`;
        return this.openClient.get(url);
    }

    createEdgeHostname(contractId, groupId, createRequestBody) {
        let url = `/papi/v0/edgehostnames/?contractId=${contractId}&groupId=${groupId}`;
        return this.openClient.post(url, createRequestBody);
    }

    activateProperty(propertyId, propertyVersion, network, notifyEmails, message, activationType = ActivationType.ACTIVATE) {
        const url = `/papi/v0/properties/${propertyId}/activations`;
        const acknowledgeAllWarnings = true;
        const complianceRecord = {
            noncomplianceReason: "NO_PRODUCTION_TRAFFIC"
        };
        const note = message || "Property Manager CLI Activation";
        return this.openClient.post(url, {
            propertyVersion,
            network,
            note,
            notifyEmails,
            acknowledgeAllWarnings,
            activationType,
            complianceRecord
        });
    }

    propertyActivateStatus(propertyId, key) {
        const url = `/papi/v0/properties/${propertyId}/activations${this._buildAccountSwitchKeyQuery(key,true)}`;
        return this.openClient.get(url);
    }

    activationStatus(propertyId, activationId) {
        let url = `/papi/v0/properties/${propertyId}/activations/${activationId}`;
        return this.openClient.get(url);
    }

    listRuleFormats() {
        let url = `/papi/v0/rule-formats`;
        return this.openClient.get(url);
    }

    getPropertyInfo(propertyId,key) {
        let url = `/papi/v0/properties/${propertyId}${this._buildAccountSwitchKeyQuery(key,true)}`;
        return this.openClient.get(url);
    }

}

module.exports = PAPI;