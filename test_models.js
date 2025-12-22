import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = "AIzaSyDocRIJ5um8XkPHcNlPeN3VHkVA2qJiLy4";

if (!apiKey) {
    console.error("No API Key found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-exp-1206",
    "gemini-2.0-flash-lite-preview-02-05",
    "learnlm-1.5-pro-experimental",
    "gemini-1.5-flash-8b",
];

async function testModel(modelName) {
    console.log(`Testing ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ SUCCESS: ${modelName} is working!`);
        console.log(`Response: ${response.text().slice(0, 50)}...`);
        return true;
    } catch (error) {
        if (error.message.includes("404")) {
            console.log(`❌ FAILURE: ${modelName} - Not Found (404)`);
        } else if (error.message.includes("429")) {
            console.log(`❌ FAILURE: ${modelName} - Quota Exceeded/Limit 0 (429)`);
        } else {
            console.log(`❌ FAILURE: ${modelName} - Error: ${error.message.slice(0, 100)}...`);
        }
        return false;
    }
}

async function runTests() {
    console.log("Starting Model Connectivity Tests...");
    for (const model of modelsToTest) {
        const success = await testModel(model);
        if (success) {
            console.log(`\n🎉 Found working model: ${model}`);
            // Optional: stop after finding first working model
            // break; 
        }
    }
    console.log("\nTests complete.");
}

runTests();
