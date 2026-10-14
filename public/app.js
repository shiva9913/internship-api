const internshipList =
    document.getElementById("internshipList");

const loading =
    document.getElementById("loading");

const error =
    document.getElementById("error");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const internshipSelect =
    document.getElementById("internshipId");

const applicationForm =
    document.getElementById("applicationForm");

const formMessage =
    document.getElementById("formMessage");


// --------------------------------
// Load internships
// --------------------------------

async function loadInternships(search = "") {

    loading.textContent = "Loading internships...";
    loading.style.display = "block";

    error.textContent = "";
    internshipList.innerHTML = "";

    try {

        const url = search
            ? `/api/internships?search=${encodeURIComponent(search)}`
            : "/api/internships";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        displayInternships(data.internships);

        populateInternshipSelect(data.internships);

    } catch (err) {

        console.error(err);

        error.textContent =
            "Unable to load internships. Please try again.";

    } finally {

        loading.style.display = "none";
    }
}


// --------------------------------
// Display internship cards
// --------------------------------

function displayInternships(internships) {

    if (internships.length === 0) {

        internshipList.innerHTML =
            "<p>No internships found.</p>";

        return;
    }

    internships.forEach((internship) => {

        const card =
            document.createElement("div");

        card.className = "internship";

        card.innerHTML = `
            <h3>${escapeHTML(internship.title)}</h3>

            <p>
                <strong>Domain:</strong>
                ${escapeHTML(internship.domain)}
            </p>

            <p>
                <strong>Mode:</strong>
                ${escapeHTML(internship.mode)}
            </p>

            <p>
                <strong>Location:</strong>
                ${escapeHTML(internship.location)}
            </p>

            <p>
                <strong>Skills:</strong>
                ${internship.skills
                .map(skill => escapeHTML(skill))
                .join(", ")}
            </p>

            <p>
                <strong>Openings:</strong>
                ${internship.openings}
            </p>

            <button
                type="button"
                class="apply-button"
                data-id="${escapeHTML(internship.id)}"
            >
                Apply
            </button>
        `;

        internshipList.appendChild(card);
    });

    document
        .querySelectorAll(".apply-button")
        .forEach(button => {

            button.addEventListener("click", () => {

                internshipSelect.value =
                    button.dataset.id;

                document
                    .getElementById("applicationForm")
                    .scrollIntoView({
                        behavior: "smooth"
                    });
            });
        });
}


// --------------------------------
// Populate select box
// --------------------------------

function populateInternshipSelect(internships) {

    internshipSelect.innerHTML = `
        <option value="">
            Select internship
        </option>
    `;

    internships.forEach((internship) => {

        const option =
            document.createElement("option");

        option.value = internship.id;

        option.textContent =
            `${internship.title} (${internship.id})`;

        internshipSelect.appendChild(option);
    });
}


// --------------------------------
// Search
// --------------------------------

searchButton.addEventListener("click", () => {

    const search =
        searchInput.value.trim();

    loadInternships(search);
});


// --------------------------------
// Application submit
// --------------------------------

applicationForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        formMessage.textContent =
            "Submitting application...";

        formMessage.className = "loading";

        const formData =
            new FormData(applicationForm);

        const application = {

            name:
                formData.get("name").trim(),

            email:
                formData.get("email").trim(),

            internshipId:
                formData.get("internshipId"),

            message:
                formData.get("message").trim()
        };


        // Client-side validation

        if (application.name.length < 2) {

            formMessage.textContent =
                "Name must contain at least 2 characters.";

            formMessage.className = "error";

            return;
        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(application.email)
        ) {

            formMessage.textContent =
                "Please enter a valid email.";

            formMessage.className = "error";

            return;
        }


        if (!application.internshipId) {

            formMessage.textContent =
                "Please select an internship.";

            formMessage.className = "error";

            return;
        }


        if (application.message.length < 10) {

            formMessage.textContent =
                "Message must contain at least 10 characters.";

            formMessage.className = "error";

            return;
        }


        try {

            const response =
                await fetch("/api/applications", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(application)
                });


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Application failed."
                );
            }


            formMessage.textContent =
                `Success! Application ID: ${data.applicationId}`;

            formMessage.className = "success";

            applicationForm.reset();


        } catch (error) {

            formMessage.textContent =
                error.message;

            formMessage.className = "error";
        }
    }
);


// --------------------------------
// Prevent unsafe HTML
// --------------------------------

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// --------------------------------
// Initial API call
// --------------------------------

loadInternships();