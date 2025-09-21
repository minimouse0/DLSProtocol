#include <httplib.h>
#include <nlohmann/json.hpp>
#include <iostream>

using json = nlohmann::json;

int main() {
    httplib::Server svr;

    svr.Get("/server_status", [](const httplib::Request&, httplib::Response& res) {
        json j = {
            {"code", 200},
            {"cpu_count", 16},
            {"cpu_freq", 3.8},
            {"cpu_rate", 2.33},
            {"mem_rate", 73.84},
            {"mem_used", 48317},
            {"mem_total", 65433},
            {"disks_info", {
                {{"symbol", "C:"}, {"disk_used", 720}, {"disk_total", 931}},
                {{"symbol", "D:"}, {"disk_used", 8}, {"disk_total", 119}},
                {{"symbol", "E:"}, {"disk_used", 2255}, {"disk_total", 3726}},
                {{"symbol", "H:"}, {"disk_used", 266}, {"disk_total", 466}},
                {{"symbol", "I:"}, {"disk_used", 831}, {"disk_total", 930}},
                {{"symbol", "J:"}, {"disk_used", 1298}, {"disk_total", 1863}}
            }}
        };

        res.set_content(j.dump(2), "application/json");
    });

    std::cout << "Server started at http://localhost:8080/server_status\n";
    svr.listen("0.0.0.0", 8080);
}
