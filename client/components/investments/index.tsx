import React, { useCallback, useEffect, useState } from 'react';
import { Fragment } from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid2";
import { styled, useTheme } from "@mui/material/styles";
import ReactEcharts from "echarts-for-react";

import './investments.css';
import { Box, Icon, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material';
import { ArrowRightAlt } from '@mui/icons-material';
import { useGenericError } from '../../hooks';
import { getInvestment } from '../../store/backend';
import { SumaryInvestements } from '../../models';


const ContentBox = styled("div")(({ theme }) => ({
    margin: "2rem",
    [theme.breakpoints.down("sm")]: { margin: "1rem" }
}));


const Title = styled("span")(() => ({
    fontSize: "1rem",
    fontWeight: "500",
    marginRight: ".5rem",
    textTransform: "capitalize"
}));

const SubTitle = styled("span")(({ theme }) => ({
    fontSize: "0.875rem",
    color: theme.palette.text.secondary
}));

const H4 = styled("h4")(({ theme }) => ({
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "1rem",
    textTransform: "capitalize",
    color: theme.palette.text.secondary
}));

const StyledCard = styled(Card)(({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px !important",
    background: theme.palette.background.paper,
    [theme.breakpoints.down("sm")]: { padding: "16px !important" }
}));



const Heading = styled("h6")(({ theme }) => ({
    margin: 0,
    marginTop: "4px",
    fontSize: "14px",
    fontWeight: "500",
    color: theme.palette.primary.main
}));



const DoughnutChart = ({ height = "", color = [""] }) => {
    const theme = useTheme();

    const option = {
        legend: {
            bottom: 0,
            show: true,
            itemGap: 20,
            icon: "circle",
            textStyle: { color: theme.palette.text.secondary, fontSize: 13, fontFamily: "roboto" }
        },
        tooltip: { show: false, trigger: "item", formatter: "{a} <br/>{b}: {c} ({d}%)" },
        xAxis: [{ axisLine: { show: false }, splitLine: { show: false } }],
        yAxis: [{ axisLine: { show: false }, splitLine: { show: false } }],

        series: [
            {
                name: "Traffic Rate",
                type: "pie",
                hoverOffset: 5,
                radius: ["45%", "72.55%"],
                center: ["50%", "50%"],
                avoidLabelOverlap: false,
                stillShowZeroSum: false,
                labelLine: { show: false },
                label: {
                    show: false,
                    fontSize: 13,
                    formatter: "{a}",
                    position: "center",
                    fontFamily: "roboto",
                    color: theme.palette.text.secondary
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: "14",
                        padding: 4,
                        fontWeight: "normal",
                        // formatter: "{b} \n{c} ({d}%)"
                        formatter: "{b} ({d}%)"
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: "rgba(0, 0, 0, 0.5)"
                    }
                },
                data: [
                    { value: 65, name: "Google" },
                    { value: 20, name: "Facebook" },
                    { value: 15, name: "Others" }
                ]
            }
        ]
    };

    return <ReactEcharts style={{ height }} option={{ ...option, color: [...color] }} />;
}

const ProductTable = styled(Table)(() => ({
    minWidth: 400,
    whiteSpace: "pre",
    "& small": {
        width: 50,
        height: 15,
        borderRadius: 500,
        boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.12), 0 2px 2px 0 rgba(0, 0, 0, 0.24)"
    },
    "& td": { borderBottom: "none" },
    "& td:first-of-type": { paddingLeft: "16px !important" }
}));

const Investments = () => {
    const { palette } = useTheme();


    const [summaryInvestment, setSummaryInvestment] = useState<SumaryInvestements>();
    const fetch = useGenericError(
        useCallback(async () => {
            const results = (await getInvestment()) as SumaryInvestements;
            setSummaryInvestment(results);
        }, [])
    );


    // On mount, fetch the recurring transactions.
    useEffect(() => {
        void fetch();
    }, [fetch]);

    return (
        <Fragment>
            <ContentBox className="analytics">
                <Grid container spacing={3}>
                    <Grid size={{ md: 8, xs: 12 }}>
                        <Grid container spacing={3} sx={{ mb: "24px" }}>
                            <Grid size={{ md: 6, xs: 12 }} >
                                <StyledCard elevation={6}>
                                    <ContentBox>
                                        <Icon className="icon" />

                                        <Box ml="12px">
                                            <h1>Total Net: </h1>
                                            <Heading>{summaryInvestment?.netSum}</Heading>
                                        </Box>
                                    </ContentBox>
                                </StyledCard>
                                <StyledCard elevation={3}>
                                    <ContentBox>
                                        <Icon className="icon" />

                                        <Box ml="12px">
                                            <h1>Total Gross: </h1>
                                            <Heading>{summaryInvestment?.grossSum}</Heading>
                                        </Box>
                                    </ContentBox>
                                </StyledCard>
                            </Grid>
                        </Grid>
                        <H4>Ongoing Projects</H4>
                    </Grid>

                    <Grid size={{ md: 4, xs: 12 }}>
                        <Card sx={{ px: 3, py: 2, mb: 3 }}>
                            <Title>Traffic Sources</Title>
                            <SubTitle>Last 30 days</SubTitle>
                            <DoughnutChart
                                height="300px"
                                color={[palette.primary.dark, palette.primary.main, palette.primary.light]}
                            />
                        </Card>

                    </Grid>

                    <Grid>
                        <ProductTable>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={4} sx={{ px: 3 }}>
                                        Type
                                    </TableCell>

                                    <TableCell colSpan={2} sx={{ px: 0 }}>
                                        Amount
                                    </TableCell>
                                    <TableCell colSpan={2} sx={{ px: 0 }}>
                                        Percentage
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {summaryInvestment?.details.map((investment, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell colSpan={4} align="left" sx={{ px: 0, textTransform: "capitalize" }}>
                                            {investment.type}
                                        </TableCell>

                                        <TableCell align="left" colSpan={2} sx={{ px: 0, textTransform: "capitalize" }}>
                                            {investment.value > 999 ? (investment.value / 1000).toFixed(1) + "k" : investment.value.toFixed(2)} €
                                        </TableCell>

                                        <TableCell align="left" colSpan={2} sx={{ px: 0, textTransform: "capitalize" }}>
                                            {investment.percentage ? investment.percentage : 0} %
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </ProductTable>

                    </Grid>
                </Grid>
            </ContentBox>
        </Fragment>
    );
};

Investments.displayName = 'Investments';

export default Investments;
