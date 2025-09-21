
import * as os from "os";
import * as si from "systeminformation"
//由于操作系统运行过程中CPU基本信息不能改变，所以在启动时获取

const cpu_count=os.cpus().length
const cpuData=si.cpu()
let memData={
    total:os.totalmem(),
    used:os.totalmem()-os.freemem()
}
let memLastChecked=Date.now()
let diskLastChecked=Date.now()
let diskData:si.Systeminformation.FsSizeData[]
si.fsSize().then(result=>diskData=result)

export async function getThisMachineHardwareStatus() {
    const rawResult=await Promise.all([si.cpuCurrentSpeed(),si.currentLoad(),])
    const cpuSpeed = rawResult[0]
    const cpuLoad = rawResult[1];
    //只有上次请求在1900ms以前才刷新状态，防止额外性能消耗
    if(Date.now()-memLastChecked>900)refreshMem()
    //硬盘刷新间隔10s
    if(Date.now()-diskLastChecked>9900)refreshDisk()


    const result = {
        code: 200,
        cpu_count,
        cpu_freq: parseFloat((cpuSpeed.avg).toFixed(1)), // GHz
        cpu_rate: parseFloat(cpuLoad.currentLoad .toFixed(2)),
        mem_rate: parseFloat(((memData.used / memData.total) * 100).toFixed(2)),
        mem_used: parseInt((memData.used/ (1024 * 1024)).toFixed(0)), // MB
        mem_total: parseInt((memData.total/ (1024 * 1024)).toFixed(0)), // MB
        disks_info: diskData.map(disk => ({
            symbol: disk.mount,
            disk_used: parseInt((disk.used / (1024 * 1024 * 1024)).toFixed(0)), // GB
            disk_total: parseInt((disk.size / (1024 * 1024 * 1024)).toFixed(0)) // GB
        }))
    };

    return result;
}

async function refreshMem(){
    //刷新时同步等待，防止短时间造成CPU高占用
    memData.used=memData.total-os.freemem()
    memLastChecked=Date.now()
}async function refreshDisk(){
    //刷新时同步等待，防止短时间造成CPU高占用
    diskData=await si.fsSize()
    diskLastChecked=Date.now()
}
