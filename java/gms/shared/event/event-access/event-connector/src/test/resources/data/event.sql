INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (1, 'EventOne', 1, 'Something', 1, TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (2, 'EventOne', 2, 'Something', 2, TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (1111, 'EventOne', 1, 'Something', 1, TO_DATE('1980-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (2222, 'EventOne', 2, 'Something', 2, TO_DATE('1980-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));

-- testFindEventsByTime
INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (3, 'Event', 3, 'Something', 1, TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (4, 'Event', 4, 'Something', 1, TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (5, 'Event', 5, 'Something', 1, TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (6, 'Event', 6, 'Something', 1, TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));

INSERT INTO GMS_GLOBAL.EVENT(EVID, EVNAME, PREFOR, AUTH, COMMID, LDDATE)
VALUES (5234223422, 'isPreferred', 42342342341, 'Something', 1, TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'));
