"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSkipCommitlint = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const init_utils_1 = require("./init-utils");
/** Return Observable<number> to check whether skip commitlint */
function isSkipCommitlint(options) {
    const { baseDir, COMMIT_EDITMSG, branchName, protectBranch, skipMsg } = options;
    const commitFile = (0, init_utils_1.join)(baseDir, COMMIT_EDITMSG);
    if (!COMMIT_EDITMSG) {
        console.info('COMMIT_EDITMSG value blank');
        return (0, rxjs_1.of)(1);
    }
    const protectRule$ = (0, rxjs_1.from)(protectBranch).pipe((0, operators_1.defaultIfEmpty)(void 0));
    const skipRule$ = (0, rxjs_1.from)(skipMsg).pipe((0, operators_1.defaultIfEmpty)(void 0));
    const content$ = (0, init_utils_1.pathAccessible)(commitFile).pipe((0, operators_1.tap)(path => {
        if (!path) {
            console.info(`COMMIT_EDITMSG file not exists: "${commitFile}"`);
            process.exit(1);
        }
    }), (0, operators_1.mergeMap)(path => (0, init_utils_1.readFileAsync)(path, { encoding: 'utf8' })), (0, operators_1.map)(msg => {
        const head = msg.split(/\n|\r\n/)[0];
        return { head, msg };
    }), (0, operators_1.share)());
    const protectTest$ = (0, rxjs_1.combineLatest)({
        branch: (0, rxjs_1.of)(branchName),
        regex: protectRule$,
    }).pipe((0, operators_1.map)(({ branch, regex }) => regex && regex.test(branch) ? true : false), (0, operators_1.filter)(matched => matched), (0, operators_1.mapTo)(0), // process.exit(0)
    (0, operators_1.defaultIfEmpty)(1));
    const skipTest$ = (0, rxjs_1.combineLatest)({
        content: content$,
        regex: skipRule$,
    }).pipe((0, operators_1.map)(({ content, regex }) => regex && regex.test(content.head) ? true : false), (0, operators_1.filter)(matched => matched), (0, operators_1.mapTo)(1), // process.exit(1)
    (0, operators_1.defaultIfEmpty)(0));
    const exitCode$ = (0, rxjs_1.forkJoin)(protectTest$, skipTest$).pipe((0, operators_1.map)(([pro, skip]) => {
        // console.info('pro:skip', pro, skip)
        // tslint:disable-next-line:no-bitwise
        return pro & skip;
    }), (0, operators_1.defaultIfEmpty)(0), // not skip commitlint
    (0, operators_1.take)(1));
    return exitCode$;
}
exports.isSkipCommitlint = isSkipCommitlint;
