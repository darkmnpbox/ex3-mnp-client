//   taking the form element
const base_url_element = document.getElementById("baseUrl");
const service_name_element = document.getElementById("serviceName");
const service_element = document.getElementById("service");
const method_element = document.getElementById("method");
const json_body_element = document.getElementById("jsonBody");
const parameter_element = document.getElementById("parameter");
const order_field_element = document.getElementById("orderField");
const order_by_element = document.getElementById("orderBy");
const search_column_element = document.getElementById("searchColumn");
const page_number_element = document.getElementById("pageNumber");
const page_size_element = document.getElementById("pageSize");
const search_term_element = document.getElementById("searchTerm");
const childrens_element = document.getElementById("childrens");

// this will alert message to UI with color : [ 'success', 'warning', 'danger', 'info' ...]
function showMessage(message, color) {
    const messages_element = document.getElementById("messages");
    const message_element = document.createElement("div");
    message_element.setAttribute("class", "alert alert-" + color);
    message_element.setAttribute("role", "alert");
    messages_element.appendChild(message_element);
    message_element.innerHTML = message;
    setTimeout(() => {
        messages_element.removeChild(message_element);
    }, 10000);
}

const paramRequiredMethods = ["GET", "PUT", "DELETE"];
const jsonBodyRequiredMethods = ["PUT", "POST"];

// making the parameter option only for needed methods
method_element.addEventListener("change", () => {
    const method = method_element.value;

    if (method !== 'GET') {
        search_term_element.disabled = true;
        order_by_element.disabled = true;
        order_field_element.disabled = true;
        page_number_element.disabled = true;
        page_size_element.disabled = true;
        childrens_element.disabled = true;
    } else {
        search_term_element.disabled = false;
        order_by_element.disabled = false;
        order_field_element.disabled = false;
        page_number_element.disabled = false;
        page_size_element.disabled = false;
        childrens_element.disabled = false;
    }

    // PRAMETER controller
    parameter_element.disabled = paramRequiredMethods.includes(method)
        ? false
        : true;

    // JSON BODY  controller
    json_body_element.disabled = jsonBodyRequiredMethods.includes(method)
        ? false
        : true;
});

function createQueryMap(serviceName, service) {
    let searchColumn = [];
    for (let column of queryMap[serviceName][service]['SEARCH_COLUMN']) {
        let name = column['COULUMN_NAME'];
        let type = column['COLUMN_TYPE'];
        if (document.getElementById('search_' + name).checked) {
            searchColumn.push({ columnName: name, columnType: type });
        }
    }
    let query = {
        requestGuid: "Qurey Builder",
        children: childrens_element.value ? [childrens_element.value] : [],
        filter: {
            orderBy: order_by_element.value,
            orderByField: order_field_element.value,
            searchTerm: search_term_element.value,
            conditions: searchColumn,
            page: {
                pageSize: parseInt(page_size_element.value),
                pageNumber: parseInt(page_number_element.value)
            }
        }
    }

    return JSON.stringify(query);
}

async function handleSubmit(e) {
    e.preventDefault();
    const baseUrl = base_url_element.value;
    const serviceName = service_name_element.value;
    const service = service_element.value;
    const method = method_element.value;
    const body = json_body_element.value;
    const param = parameter_element.value;
    let url;
    if (method === 'GET' && !param) {
        const query = createQueryMap(serviceName, service);
        url = baseUrl + "/" + serviceName + "/" + service + '?query=' + query;
    } else {
        url = paramRequiredMethods.includes(method)
            ? baseUrl + "/" + serviceName + "/" + service + (param ? "/" + param : "")
            : baseUrl + "/" + serviceName + "/" + service;
    }
    console.log(url);
    const socketId = sessionStorage.getItem("socketId");
    if (socketId) {
        const requestId = Date.now().toString();
        const requestBody = {
            socketId: socketId,
            requestId: requestId,
            data: body ? JSON.parse(body) : {},
        };
        await callApi(url, method, requestBody, serviceName, service);
    } else {
        showMessage("Not connected with socket...", "danger");
    }
}

async function callApi(url, method, requestBody, serviceName, service) {
    showMessage("Calling the Api-gateway...", "success");

    if (method === "GET") {
        try {
            const response = await fetch(url, {
                method: method,
                mode: "cors",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                }
            })
            const data = await (await Promise.resolve(response)).json();
            console.log(data);
            showMessage(data.message, "danger");
        } catch (error) {
            showMessage(error.message, "danger");
        }


    } else {
        try {
            const response = await fetch(url, {
                method: method,
                mode: "cors",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });
            const data = await (await Promise.resolve(response)).json();
            if (data.status === "SUCCESS") {
                let requestMap = sessionStorage.getItem("RequestMap")
                    ? JSON.parse(sessionStorage.getItem("RequestMap"))
                    : {};
                requestMap[requestBody.requestId] = { serviceName, service };
                sessionStorage.setItem("RequestMap", JSON.stringify(requestMap));
                showMessage(
                    `requesetId : ${requestBody.requestId} registered on RequestMap`,
                    "info"
                );
            } else {
                showMessage(data.message, "danger");
            }
            console.log(data);
        } catch (error) {
            showMessage(error.message, "danger");
        }
    }
}

const queryMap = {
    IOT_SERVICE: {
        DEPARTMENT: {
            ORDER_BY_FIELD: ["id", "name"],
            ORDER_BY: ["ASC", "DESC"],
            SEARCH_COLUMN: [
                {
                    COULUMN_NAME: "name",
                    COLUMN_TYPE: "string",
                },
            ],
            CHILDRENS: ['employees']
        },
        EMPLOYEE: {
            ORDER_BY_FIELD: ["id", "name", "age"],
            ORDER_BY: ["ASC", "DESC"],
            SEARCH_COLUMN: [
                {
                    COULUMN_NAME: "name",
                    COLUMN_TYPE: "string",
                },
                {
                    COULUMN_NAME: "age",
                    COLUMN_TYPE: "number",
                },
            ],
            CHILDRENS: ['departments']
        },
    },
};


function generateServiceName() {
    let options = "";
    for (let serviceName of Object.keys(queryMap)) {
        options += `<option value="${serviceName}" selected>${serviceName}</option>`;
    }
    service_name_element.innerHTML = options;
    generateService();
}

function generateService() {
    let options = "";
    let serviceName = service_name_element.value;
    for (let service of Object.keys(queryMap[serviceName])) {
        options += `<option value="${service}" selected>${service}</option>`;
    }
    service_element.innerHTML = options;
    generateOrderFieldAndOrderByAndSearchColumn();
}

function generateOrderFieldAndOrderByAndSearchColumn() {
    let options = "";
    let serviceName = service_name_element.value;
    let service = service_element.value;
    for (let orderField of queryMap[serviceName][service]["ORDER_BY_FIELD"]) {
        options += `<option value="${orderField}" class="text-uppercase" selected>${orderField}</option>`;
    }
    order_field_element.innerHTML = options;

    options = "";
    for (let orderBy of queryMap[serviceName][service]["ORDER_BY"]) {
        options += `<option value="${orderBy}" selected>${orderBy}</option>`;
    }
    order_by_element.innerHTML = options;

    options = "";
    for (let serchColumn of queryMap[serviceName][service]["SEARCH_COLUMN"]) {
        let title = serchColumn["COULUMN_NAME"];
        options += `<div class="form-check">
            <input class="form-check-input" type="checkbox" value="${title}" id="search_${title}" checked>
            <label class="form-check-label text-uppercase" for="${title}">
            ${title}
            </label>
            </div>`;
    }
    search_column_element.innerHTML = options;

    options = `<option value="" selected>NONE</option>`;
    for (let children of queryMap[serviceName][service]["CHILDRENS"]) {
        options += `<option value="${children}" class="text-uppercase">${children}</option>`
    }
    childrens_element.innerHTML = options;
}

document.addEventListener("DOMContentLoaded", () => {
    generateServiceName();
});

service_name_element.addEventListener("change", () => {
    generateService();
});

service_element.addEventListener("change", () => {
    generateOrderFieldAndOrderByAndSearchColumn();
});
