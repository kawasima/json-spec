const s = require('@json-spec/core');
const gen = require('@json-spec/core/gen');
const { parseApiSpec, readSpec } = require('../core');

describe('openapi', () => {
    test('oneOf', async () => {
        const spec = await readSpec({
            openapi: "3.0",
            paths: {
                "/": {
                    "get": {
                        responses: {
                            "200": {
                                content: {
                                    "application/json": {
                                        schema: {
                                            oneOf: [
                                                {
                                                    type: "object",
                                                    properties: {
                                                        name: {
                                                            type: "string"
                                                        }
                                                    },
                                                    required: ["name"]
                                                },
                                                {
                                                    type: "object",
                                                    properties: {
                                                        age: {
                                                            type: "integer"
                                                        }
                                                    },
                                                    required: ["age"]
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }, {
        }, function({method, path, specs}) {
            const spec = specs.response["200"]["application/json"];
            console.log(spec);
            console.log(gen.sample(s.gen(spec)));
            return {
                method,
                path,
                specs
            }
        });
        
    })
})