document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");
    
    const modal = document.getElementById("resultModal");
    const closeButton = document.querySelector(".close-button");
    
    closeButton.addEventListener("click", function() {
        modal.style.display = "none";
    });
    
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    
    const form = document.getElementById("churnForm");
    if (!form) {
        console.error("Form with ID 'churnForm' not found!");
    } else {
        console.log("Form found, attaching submit listener");
        
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            console.log("Form submitted");

            let formData = {
                CreditScore: document.querySelector("[name='CreditScore']").value,
                Geography_France: document.querySelector("[name='Geography']").value === "France" ? 1 : 0,
                Geography_Germany: document.querySelector("[name='Geography']").value === "Germany" ? 1 : 0,
                Geography_Spain: document.querySelector("[name='Geography']").value === "Spain" ? 1 : 0,
                Gender: document.querySelector("[name='Gender']").value === "Male" ? 1 : 0,
                Age: document.querySelector("[name='Age']").value,
                Tenure: document.querySelector("[name='Tenure']").value,
                Balance: document.querySelector("[name='Balance']").value,
                NumOfProducts_1: document.querySelector("[name='NumOfProducts']").value == "1" ? 1 : 0,
                NumOfProducts_2: document.querySelector("[name='NumOfProducts']").value == "2" ? 1 : 0,
                NumOfProducts_3: document.querySelector("[name='NumOfProducts']").value == "3" ? 1 : 0,
                NumOfProducts_4: document.querySelector("[name='NumOfProducts']").value == "4" ? 1 : 0,
                HasCrCard: document.querySelector("[name='HasCrCard']").value === "1" ? 1 : 0,
                IsActiveMember: document.querySelector("[name='IsActiveMember']").value === "1" ? 1 : 0,
                EstimatedSalary: document.querySelector("[name='EstimatedSalary']").value
            };
            
            console.log("Form data collected:", formData);

            fetch("/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            .then(response => {
                console.log("Response status:", response.status);
                if (!response.ok) {
                    throw new Error("Network response was not ok: " + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log("Prediction result:", data);
                
                const customerDetails = {
                    "Customer ID": document.querySelector("[name='CustomerID']").value,
                    "Full Name": document.querySelector("[name='Name']").value,
                    "Credit Score": document.querySelector("[name='CreditScore']").value,
                    "Geography": (() => {
                            const geoValue = document.querySelector("[name='Geography']").value;
                            const geoMap = {
                                "France": "India",
                                "Spain": "USA",
                                "Germany": "Germany"
                            };
                            return geoMap[geoValue] || geoValue;
                        })(),
                    "Gender": document.querySelector("[name='Gender']").value,
                    "Age": document.querySelector("[name='Age']").value,
                    "Tenure": document.querySelector("[name='Tenure']").value + " years",
                    "Balance": "$" + parseFloat(document.querySelector("[name='Balance']").value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                    "Number of Products": document.querySelector("[name='NumOfProducts']").value,
                    "Has Credit Card": document.querySelector("[name='HasCrCard']").value === "1" ? "Yes" : "No",
                    "Is Active Member": document.querySelector("[name='IsActiveMember']").value === "1" ? "Yes" : "No",
                    "Estimated Salary": "$" + parseFloat(document.querySelector("[name='EstimatedSalary']").value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                };
                
                let tableHTML = '<table class="customer-table">';
                for (const [key, value] of Object.entries(customerDetails)) {
                    tableHTML += `<tr><th>${key}</th><td>${value}</td></tr>`;
                }
                tableHTML += '</table>';
                
                document.getElementById("customerDetails").innerHTML = tableHTML;
                
                const customerName = customerDetails["Full Name"];
                const predictionDisplay = document.getElementById("predictionDisplay");
                
                if (data.churn) {
                    predictionDisplay.className = "prediction-display prediction-negative";
                    predictionDisplay.innerHTML = `Customer <span class="customer-name">${customerName}</span> is likely to churn`;
                } else {
                    predictionDisplay.className = "prediction-display prediction-positive";
                    predictionDisplay.innerHTML = `Customer <span class="customer-name">${customerName}</span> is not likely to churn`;
                }
                
                modal.style.display = "block";
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Error processing prediction. Please check console for details.");
            });
        });
    }
});